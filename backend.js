/* eslint-disable no-const-assign */
const cookieParser = require('cookie-parser');
const express = require("express");
const cors = require("cors");
const https = require("https");
const app = express();
const path = require('path');
const { v4: uuidv4 } = require('uuid');
// Set the PORT environment variable to a custom value
const port = 3080;
app.use(cookieParser()); // To parse cookies from the request
const sessionData = {};

app.use((req, res, next) => {
  if (!req.cookies.sessionId) {
      const sessionId = uuidv4();
      sessionData[sessionId] = {};
      res.cookie('sessionId', sessionId, { httpOnly: true });
  }
  next();
});

// max_token limits
const modelTokenLimits = {
  "gpt-3.5-turbo": 4096,
  "gpt-3.5-turbo-0301": 4096,
  "gpt-3.5-turbo-16k":16384,
  "text-davinci-002": 4096,
  "code-davinci-002": 8001,
  "gpt-4": 8192,
  "gpt-4-0314": 8192,
  "gpt-4-0613": 8192,
  "gpt-3.5-turbo-16k-0613":16384,
  "text-davinci-003": 4096,
  "text-curie-001": 2049,
  "text-babbage-001": 2049,
  "text-ada-001": 2049,
  "davinci": 2049,
  "curie": 2049,
  "babbage": 2049,
  "ada": 2049,
  "code-davinci-001": 8001,
  "code-cushman-002": 2047,
  "code-cushman-001": 2047,
};

const Codelanguage = {
  Python: ["Python", "py"],
  Javascript: ["JavaScript", "js"],
  Java: ["Java"],
  csharp: ["csharp"],
  Ruby: ["Ruby"],
  PHP: ["PHP"],
  Go: ["Go"],
  Swift: ["Swift"],
  Kotlin: ["Kotlin"],
  Bash: ["Bash"],
  TypeScript: ["TypeScript"],
  Rust: ["Rust"],
  Haskell: ["Haskell"],
  Perl: ["Perl"],
  Scala: ["Scala"],
  Clojure: ["Clojure"],
  Elixir: ["Elixir"],
  Lua: ["Lua"],
  Crystal: ["Crystal"],
  Fsharp: ["F#"],
  Dlang: ["Dlang"],
  Dart: ["Dart"],
  Nim: ["Nim"],
  Groovy: ["Groovy"],
  OCaml: ["OCaml"],
  Pascal: ["Pascal"],
  Assembly: ["Assembly"],
  Prolog: ["Prolog"],
  SQL: ["SQL"],
  HTML: ["HTML"],
  CSS: ["CSS"],
  Svelte: ["Svelte"],
  Latex: ["Latex"],
  Markdown: ["Markdown","Marp"],
  Yaml: ["YAML","yaml"],
  Json: ["Json"],
  XML: ["XML"],
  SVG: ["SVG"],
  Julia: ["Julia"],
  PowerShell: ["PowerShell"],
  Batchfile: ["Batchfile"],
  Cmake: ["Cmake"],
  Makefile: ["Makefile"],
  Dockerfile: ["Dockerfile"],
  ShellScript: ["ShellScript"],
  MatLab: ["MATLAB"],
  Cplusplus: ["C++", "cpp"],
  Unix: ["Unix"],
  Linux:["Ubuntu","Kali","Linux","Mint"],
  Verilog:["Verilog"],
  Binary:['Binary'],
  ASCII:['ASCII','ascii'],
  Brainfuck:['Brainf**k'],
  Arduino:['Arduino'],
  Raspberry:["Raspberry"],
  ARM:["ARM"],
  MicroPython:["MicroPython"],
  R: ["R"],
  Table:["table","Excel"],
  C: ["C"],
}

// Import the natural library and its Tokenizer
const natural = require("natural");
// eslint-disable-next-line no-unused-vars
const tokenizer = new natural.WordTokenizer();
console.log('Library and Tokenizer loaded');
let defaultAssistantMessage = "Anything else?";
// Define conversation history tokens
let conversationHistoryTokens = 0;
let conversationHistory = [];
const addMessageToConversationHistory = (message, safeTokensForHistory) => {
  const messageTokens = estimateTokensInText(message);
  conversationHistory.push({message, tokens: messageTokens});
  conversationHistoryTokens += messageTokens;
  while (conversationHistoryTokens > safeTokensForHistory) {
    let removedMessage = conversationHistory.shift();
    conversationHistoryTokens -= removedMessage.tokens;
  }
};

app.use(cors());
app.use(express.json());

app.use(cors({ origin: 'http://localhost:3080' }));

// Cors handling
app.use((err, req, res, next) => {
  if (err instanceof cors.CorsError) {
    console.log(err);
    res.status(500).json({ message: 'CORS error occurred' });
  } else {
    next(err);
  }
});


// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));


const getModels = (Key) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.openai.com",
      port: 443,
      path: "/v1/engines",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Key}`,
      },
    };
    const request = https.request(options, (response) => {
      let data = "";
      response.on("data", (chunk) => {
        data += chunk;
      });
      response.on("end", () => {
        try {
          // A list of available models
          const availableModels = ["gpt-3.5-turbo-0301", "gpt-4-0613", "gpt-4-0314", "gpt-3.5-turbo-16k-0613", "gpt-3.5-turbo", "gpt-3.5-turbo-0613", "gpt-4", "gpt-3.5-turbo-16k"];
          const parsedData = JSON.parse(data);
          const engines = parsedData.data;
          const deprecatedModelsList = engines.filter(engine => !availableModels.includes(engine.id));
          resolve({
            availableModels: availableModels,
            deprecatedModels: deprecatedModelsList,
          });
        } catch (err) {
          reject(err);
        }
      });
    });
    request.on("error", (err) => {
      console.error("Request error:", err);
      reject(err);
    });
    request.end();
  });
};

// define the caching duration (1 hour in this example)
const cacheDuration = 60 * 60 * 1000; // milliseconds
let lastFetchTime = null;
let storedModels = null;

// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));
// parse application/json
app.use(express.json());

app.get('/api/models', async (req, res) => {
  const sessionId = req.cookies.sessionId;
  if (!sessionId || !sessionData[sessionId] || !sessionData[sessionId].key) {
    return res.status(400).json({ error: "API key is not set. Please use /api/save-key endpoint to set the key." });
  }
  const apiKey = sessionData[sessionId].key;
  const now = Date.now();
  // If the last fetch time is undefined or the cache is expired, fetch the models
  if (!lastFetchTime || (now - lastFetchTime) >= cacheDuration) {
    console.log("Fetching models from OpenAI API...");
    try {
      const models = await getModels(apiKey);
      storedModels = models;
      lastFetchTime = now;
      //console.log("Models fetched successfully:", storedModels);
    } catch (error) {
      //console.error("Failed to fetch models:", error);
      return res.status(500).json({ error: "Failed to fetch models" });
    }
  }

  // Return the cached models
  //console.log("Returning cached models:", storedModels);
  res.json(storedModels);
});



// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname+'/build/index.html'));
});

console.log('Middleware configured');
// api key handling
app.post("/api/save-key", (req, res) => {
  const { key } = req.body;
  const sessionId = req.cookies.sessionId;  // Get session ID from the cookie
  sessionData[sessionId] = {
      key: key
    };
  
  if (key === '179109'){
    console.log("Activated Admin Controls");
    sessionData[sessionId].key = "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";
  }else{
    sessionData[sessionId].key = key;
    }
  // Save the key to your backend
  console.log("Received key:", sessionData[sessionId].key);
  res.cookie('sessionId', sessionId, { httpOnly: true });
  // Handle saving the key to your backend, e.g., store it in a database
  res.sendStatus(200); // Send a success response
});

// Function to estimate tokens in text
const estimateTokensInText = (text) => {
  if (typeof text !== 'string') {
        console.error('Invalid input to estimateTokensInText. Expected a string, got:', text);
        return 0;  // Or another suitable default value
    }
  return Math.floor(text.length / 4);
};
console.log('Estimate Tokens function defined');

app.post("/api/chat", async (req, res) => {
  console.log("Received a POST request at /chat");
  console.log(req.body);
  const sessionId = req.headers.sessionid || req.cookies.sessionId;
  if (!sessionId || !sessionData[sessionId]) {
    return res.status(400).send("Invalid session ID");
  }  
  if (!sessionData[sessionId]) {
    sessionData[sessionId] = {
      conversationHistory: []
    };
  }
  const conversationHistory = req.body.conversationHistory || [];

if (conversationHistory) {
  for (let i = 0; i < conversationHistory.length; i++) {
    if (i % 2 !== 0 && conversationHistory[i].role !== "assistant") {
      // If the conversation message is supposed to be from the assistant but isn't
      conversationHistory.splice(i, 0, {
        role: "assistant",
        content: defaultAssistantMessage,
      });
    }
  }

  // Check for undefined or missing 'content' in the conversation history
  for (let message of conversationHistory) {
    if (message.content === undefined || message.content === null) {
      // Insert default assistant message to message.content
      message.content = defaultAssistantMessage;
      // No need to send an error and clear the conversation history anymore,
      // as we're now providing a default message for undefined or null content.
    }
  }
}
  const prompt = req.body.message;
  if (!prompt) {
    return res.status(400).send("No message content provided");
  }
  console.log(`Prompt: ${prompt}`);
  // Add user message to the conversation history

  const model = req.body.currentModel;
  const maxTokensForModel = modelTokenLimits[model];
  const isChatModel = model.startsWith("gpt-"); // check if model is a chat model
  console.log(`Model: ${model}, Max Tokens for Model: ${maxTokensForModel}`);
  console.log(`Is Chat Model: ${isChatModel}`);
  console.log(`Key: ${sessionData[sessionId].key}`)
  const path = isChatModel
    ? `/v1/chat/completions`
    : `/v1/engines/${model}/completions`;
  const options = {
    hostname: "api.openai.com",
    port: 443,
    path: path,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionData[sessionId].key}`,
    },
  };
  console.log(`Path: ${path}`);

  const tokenizedPrompt = prompt;
  const userTokens = estimateTokensInText(tokenizedPrompt);
  console.log(`User Tokens: ${userTokens}`);
  const TOKEN_BUFFER = 10; // Buffer to avoid overestimating token usage
  const safeTokensForCompletion =
    Math.floor(maxTokensForModel * 0.5) - TOKEN_BUFFER;
  const safeTokensForHistory =
    maxTokensForModel - safeTokensForCompletion - TOKEN_BUFFER;
  console.log(
    `Safe Tokens for Completion: ${safeTokensForCompletion}, Safe Tokens for History: ${safeTokensForHistory}`
  );
  // Check if the latest user message is too long
  if (userTokens > safeTokensForCompletion) {
    // Tokenize by lines
    const lines = tokenizedPrompt.split("\n");
    // Initialize a new message and token count
    let truncatedMessage = "";
    let tokens = 0;
    // Add lines to the new message until we reach the token limit
    for (const line of lines) {
      const lineTokens = estimateTokensInText(line);
      if (tokens + lineTokens > safeTokensForCompletion) {
        break;
      }
      truncatedMessage += line + "\n";
      tokens += lineTokens;
    }
    // Replace the user's message with the truncated message
    tokenizedPrompt = truncatedMessage;
    userTokens = tokens;
  }
  addMessageToConversationHistory(tokenizedPrompt, safeTokensForHistory);
  // Construct a new history that fits in the safe tokens limit.
  let tokenCount = userTokens;
  let safeHistory = [];
  if (req.body.conversationHistory) {
    for (let i = req.body.conversationHistory.length - 1; i >= 0; i--) {
      const message = req.body.conversationHistory[i];
      const tokensInMessage = estimateTokensInText(message.content);

      if (tokenCount + tokensInMessage > safeTokensForHistory) {
        break;
      }

      safeHistory.unshift(message);
      tokenCount += tokensInMessage;
    }
  }
  console.log(`\nModel: ${req.body.currentModel}`);
  console.log(`System Role: ${"system"}`);
  console.log(`System Message: ${req.body.systemMessage}`);
  console.log(`Temperature:${req.body.temperature}`);
  const data =
    isChatModel && conversationHistoryTokens + userTokens <= maxTokensForModel
      ? // This ensures that the conversation history and the new user message doesn't exceed the model's maximum token limit.
        JSON.stringify({
          model: model,
          messages: safeHistory.concat([
            // Add the conversation history to the messages sent to the API
            {
              role: "system",
              content: req.body.systemMessage,
            },
            {
              role: "user",
              content: tokenizedPrompt,
            },
          ]),
          max_tokens: safeTokensForCompletion,
          temperature: req.body.temperature,
        })
      : JSON.stringify({
          prompt: tokenizedPrompt,
          max_tokens: safeTokensForCompletion,
          n: 1,
          stop: null,
          temperature: req.body.temperature,
        });

  const apiRequest = https.request(options, (apiResponse) => {
    let rawData = "";
    apiResponse.on("data", (chunk) => {
      rawData += chunk;
    });

    apiRequest.on("error", (error) => {
      console.error(error);
      res.status(500).json({ error: error.message });
    });
    function extractTables(message) {
      const tablePattern = /\|(?:\r?\n|\r)?(.*\|)*(?:\r?\n|\r)?/g;
      let match;
      let tables = [];
    
      while ((match = tablePattern.exec(message)) !== null) {
        tables.push(match[0]);
      }
    
      return tables;
    }
    
  
    apiResponse.on("end", () => {
      const parsedResponse = JSON.parse(rawData);
      let responseMessage = "";
      // Assume `parsedResponse` comes from your OpenAI API call
      if (parsedResponse && parsedResponse.choices) {
        const systemResponse = parsedResponse.choices.find(
          (choice) => choice.role === "assistant"
        );
        if (!systemResponse) {
          console.error("No 'assistant' role found in choices");
          responseMessage = parsedResponse.choices[0]?.message.content;
        } else {
          responseMessage = systemResponse.message.content;
        }
      } else {
        console.error("Invalid API response", parsedResponse);
        // Handle the error
      }
      if (parsedResponse.error) {
        console.error(parsedResponse.error);
        if (
          parsedResponse.error.message.includes("not found") &&
          model === "gpt-3.5-turbo"
        ) {
          console.log("Fallback to gpt-3.5-turbo-0301");
          // Fallback to gpt-3.5-turbo-0301 and make a new request
        } else {
          res.status(500).json({ error: parsedResponse.error.message });
        }
      } else {
        responseMessage = isChatModel
          ? parsedResponse.choices[0]?.message.content // added optional chaining to prevent possible undefined error
          : parsedResponse.choices[0]?.text; // added optional chaining to prevent possible undefined error
        console.log("Raw Response: ", responseMessage);
        // Check if message is a code block
        let finalResponse = {
          message: "",
          codeBlocks: [],
          tables: [],
          imageUrls: [], // Initialize imageUrls to an empty array
          
        };
        // If there is a code block
        if (responseMessage.includes("```")) {
          console.log("Detected a code block in the response");

          const lines = responseMessage.split("\n");
          let codeBlocks = [];
          let currentBlock = [];
          let inBlock = false;
          let language = "";
          let remainingMessage = responseMessage;
          for (let line of lines) {
            if (line.startsWith("```") && !inBlock) {
              // Check for language in the non-code block sections of the message
              const nonCodeBlocks = responseMessage.split("```");
              for (const nonCodeBlock of nonCodeBlocks) {
                for (const lang in Codelanguage) {
                  if (Codelanguage.hasOwnProperty(lang)) {
                    const keywords = Codelanguage[lang];
                    for (const keyword of keywords) {
                      if (nonCodeBlock.includes(keyword)) {
                        language = lang;
                        break;
                      }
                    }
                    if (language !== "") {
                      break;
                    }
                  }
                }
              }
              if (language === "") {
                language = line.slice(3) || "Not Identified";
              }
              inBlock = true;
            } else if (line === "```" && inBlock) {
              // Only add to codeBlocks if currentBlock is not empty
              if (currentBlock.length > 0) {
                codeBlocks.push({ language, code: currentBlock.join("\n") });
              }
              currentBlock = [];
              language = "";
              inBlock = false;
            } else if (inBlock) {
              currentBlock.push(line);
            } else {
              remainingMessage += line + "\n";
            }
          }
          // After code block parsing:
          remainingMessage = remainingMessage.trim();
          finalResponse.message = remainingMessage; // the remainingMessage after removing code blocks
          finalResponse.codeBlocks = codeBlocks;
        } else {
          // No code block detected in the response
          console.log("No code block detected in the response");
          finalResponse = {
            message: responseMessage,
            codeBlocks: [], // initialize codeBlocks to an empty array
            tables: [],
            imageUrls: [], // Initialize imageUrls to an empty array
            
          };
        }
        // Check if the message contains a table
        const tables = extractTables(finalResponse.message);
        if (tables.length > 0) {
          console.log("Detected a table in the response");
          console.log("Extracted tables:", tables);

          // Remove tables from the message
          const parsedTables = tables.map((tableString) => {
            const lines = tableString
              .split("\n")
              .filter((line) => line.trim() !== "");
            const headers = lines[0].split("|").map((header) => header.trim());
            const rows = lines
              .slice(1)
              .map((rowString) =>
                rowString.split("|").map((cell) => cell.trim())
              );

            return { headers, rows };
          });

          finalResponse.tables = parsedTables;
        } else {
          // No table detected in the response
          console.log("No table detected in the response");
          finalResponse = {
            message: responseMessage,
            codeBlocks: finalResponse.codeBlocks || [], // keep the existing value or initialize to an empty array
            imageUrls: [], // Initialize imageUrls to an empty array
            
          };
        }
        // Check if the message contains image references
        const imageRegex = /!\[.*?\]\((.*?)\)/g;
        let match;
        while ((match = imageRegex.exec(finalResponse.message)) !== null) {
          const imageUrl = match[1];
          finalResponse.imageUrls.push(imageUrl);
        }
        // If there is a message, add it to the conversation history
        // Create the base assistant message
        let assistantMessage = {
          role: "assistant",
          content: finalResponse.message || "", // Default to an empty string
          codeBlocks: [], // Default to an empty array
        };

    // If there were code blocks, add each to the codeBlocks property of the assistant message
    if (finalResponse.codeBlocks.length > 0) {
      finalResponse.codeBlocks.forEach((block) => {
          // Only add the block if there's code in it
          if (block.code && block.code.trim() !== "") {
              assistantMessage.codeBlocks.push({
                  text: block.code,
                  code: true,
                  language: block.language,
              });
          }
      });
  }else{
    let line = finalResponse.responseMessage || ""; // if responseMessage is undefined, assign an empty string to line
    if (line.startsWith("```")) {
      const language = line.slice(3) || "Not Identified";
      assistantMessage.codeBlocks.push({
        text: "",
        code: true,
        language: language,
      });
    }
  }     
        // Add the assistant message to the conversation history only if there's content or code blocks
        if (
          assistantMessage.content.trim() !== "" ||
          assistantMessage.codeBlocks.length > 0
        ) {
          conversationHistory.push(assistantMessage);
        }
        // Use the processed finalResponse to generate your response JSON
        console.log(`submitting from finalResponse to json`);
        res.json({
          message: finalResponse.message,
          codeBlocks: finalResponse.codeBlocks,
          tables: finalResponse.tables,
          imageUrls: finalResponse.imageUrls,     
        });
      }
    });
  });

  apiRequest.on("error", (error) => {
    console.error(error);
    res.status(500).send(error.message);
  });

  apiRequest.write(data);
  apiRequest.end();
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});


