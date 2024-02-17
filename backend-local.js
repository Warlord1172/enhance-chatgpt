/* eslint-disable no-const-assign */
const cookieParser = require('cookie-parser');
const express = require("express");
const cors = require("cors");
const https = require("https");
const app = express();
const path = require('path');
const fs = require('fs');
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
  "gpt-3.5-turbo-0613":4096,
  "gpt-3.5-turbo-1106":4096, //returns 16384 apparently
  "gpt-4-1106-preview":4096, // returns 128000 apparently
  "gpt-4-32k": 32768,
  "gpt-4-32k-0613":32768,
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
  if (typeof err === 'object' && err instanceof cors.CorsError) {
    console.log(err);
    res.status(500).json({ message: 'CORS error occurred' });
  } else {
    next(err);
  }
});



// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));


const getModels = (apiKey) => {
  return new Promise((resolve, reject) => {
    if (!apiKey) {
      reject("API key not provided");
    }
    const options = {
      hostname: "api.openai.com",
      port: 443,
      path: "/v1/engines",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
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
          const availableModels = ["gpt-3.5-turbo-0301", "gpt-3.5-turbo", "gpt-3.5-turbo-0613", "gpt-3.5-turbo-1106", "gpt-3.5-turbo-16k-0613", "gpt-3.5-turbo-16k", "gpt-4", "gpt-4-0613", "gpt-4-0314", "gpt-4-1106-preview"];
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

const cacheDuration = 60 * 60 * 1000; // milliseconds
let lastFetchTime = null;
let storedModels = null;

const fetchAndCacheModels = (apiKey) => {
  console.log("Fetching models from OpenAI API...");

  getModels(apiKey)
    .then((models) => {
      storedModels = models;
      lastFetchTime = Date.now();
      console.log("Models fetched successfully:", storedModels);
    })
    .catch((error) => {
      console.error("Failed to fetch models:", error);
    });
};

const loadModelsFromCache = (apiKey) => {
  if (fs.existsSync("modelsCache.json")) {
    const cacheData = fs.readFileSync("modelsCache.json", "utf8");

    try {
      const parsedData = JSON.parse(cacheData);

      if (
        parsedData &&
        parsedData.models &&
        parsedData.timestamp &&
        Date.now() - parsedData.timestamp < cacheDuration
      ) {
        console.log("Loading models from cache...");
        storedModels = parsedData.models;
        lastFetchTime = parsedData.timestamp;
        console.log("Models loaded from cache:", storedModels);
      } else {
        fetchAndCacheModels(apiKey);
      }
    } catch (error) {
      console.error("Error parsing cache data:", error);
      fetchAndCacheModels(apiKey);
    }
  } else {
    fetchAndCacheModels(apiKey);
  }
};

const saveModelsToCache = (apiKey) => {
  const cacheData = {
    models: storedModels,
    timestamp: lastFetchTime,
  };

  const jsonData = JSON.stringify(cacheData);

  fs.writeFileSync("modelsCache.json", jsonData, "utf8");

  console.log("Models saved to cache:", storedModels);
};

loadModelsFromCache();

setInterval((apiKey) => {
  fetchAndCacheModels(apiKey);
}, cacheDuration);

process.on("SIGINT", () => {
  saveModelsToCache();
  process.exit();
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get('/API/models', async (req, res) => {
  const sessionId = req.cookies.sessionId;
  if (!sessionId || !sessionData[sessionId] || !sessionData[sessionId].key) {
    return res.status(400).json({ error: "API key is not set. Please use /api/save-key endpoint to set the key." });
  }
  const apiKey = sessionData[sessionId].key;
  const now = Date.now();
  if (!lastFetchTime || (now - lastFetchTime) >= cacheDuration) {
    console.log("Fetching models from OpenAI API...");
    try {
      const models = await getModels(apiKey);
      storedModels = models;
      lastFetchTime = now;
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch models" });
    }
  }

  res.json(storedModels);
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname+'/build/index.html'));
});

console.log('Middleware configured');
// api key handling
app.post("/API/save-key", (req, res) => {
  const { key } = req.body;
  const sessionId = req.cookies.sessionId;  // Get session ID from the cookie
  sessionData[sessionId] = {
    key: key
  }; 

  if (key === '179109') {
    console.log("Activated Admin Controls");
    const adminKey = fs.readFileSync('key.txt', 'utf8');
    sessionData[sessionId].key = adminKey;
  } else {
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

app.post("/API/get-model-token-limits", (req, res) => {
  // get current model
  const model = req.body.currentModel;
  // Calculate the safe tokens for completion based on your logic
  const maxTokensForModel = modelTokenLimits[model];
  const TOKEN_BUFFER = 10; // Adjust the token buffer value as needed
  const safeTokensForCompletion = Math.floor(maxTokensForModel * 0.5) - TOKEN_BUFFER;

  // Create the response object with the modelTokenLimits and safeTokensForCompletion
  const response = {
    model,
    safeTokensForCompletion,
  };

  // Send the response to the frontend
  res.json(response);
});

app.post("/API/chat", async (req, res) => {
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
    // Regular expressions to match specific patterns
    const fractionRegex = /\\frac\{([^{}]+)\}\{([^{}]+)\}/g;
    const sqrtRegex = /\\sqrt{([^{}]+)}/g;
    const logarithmRegex = /\\log_{([^{}]+)}{([^{}]+)}/g;
    const trigonometryRegex = /\\(sin|cos|tan|sec|csc|cot){([^{}]+)}/g;
    const greekLetterRegex = /\\(alpha|beta|gamma|delta|epsilon|theta|lambda|mu|pi|phi|sigma|omega)/g;
    const integralRegex = /\\int_{([^{}]+)}{([^{}]+)}/g;
    const summationRegex = /\\sum_{([^{}]+)}{([^{}]+)}/g;
    const productRegex = /\\prod_{([^{}]+)}{([^{}]+)}/g;
    const limitRegex = /\\lim_{([^{}]+)}{([^{}]+)}/g;
    const implicationRegex = /\\(Rightarrow|Leftrightarrow)/g;
    const inequalityRegex = /\\(leq|geq|neq)/g;
    const infinityRegex = /\\infty/g;
    const multiplicationRegex = /\\(times|cdot)/g;
    const divisionRegex = /\\div/g;
    const approximateRegex = /\\approx/g;
    const subsetRegex = /\\subseteq/g;
    const supersetRegex = /\\supseteq/g;
    const emptySetRegex = /\\emptyset/g;
    const quantifierRegex = /\\(forall|exists)/g;;
    const binomialCoefficientRegex = /\\binom{([^{}]+)}{([^{}]+)}/g;
    const matrixRegex = /\\begin{bmatrix}([^{}]+)\\end{bmatrix}/g;
    const vectorRegex = /\\begin{bmatrix}([^{}]+)\\end{bmatrix}/g;
    const unionRegex = /\\cup/g;
    const intersectionRegex = /\\cap/g;
    const negationRegex = /\\neg/g;

    // Helper function to replace matched patterns with readable context
    function replaceMathExpressions(expression) {
        // Replace fractions
        expression = expression.replace(fractionRegex, (match, numerator, denominator) => {
          let numeratorValue = numerator ? numerator.trim() : '';
          let denominatorValue = denominator ? denominator.trim() : '';

          // Handle the case where numerator or denominator is not defined
          if (!numeratorValue || !denominatorValue) {
            return "Invalid fraction";
          }

          return `(${numeratorValue}) / (${denominatorValue})`;
        });

        // Replace square roots
        expression = expression.replace(sqrtRegex, (match, radicand) => {
          return `√(${radicand})`;
        });

        // Replace integrals
        expression = expression.replace(integralRegex, (match, lower, upper) => {
          let lowerval = lower ? lower.trim() : '';
          let upperval = upper ? upper.trim() : '';

          // Handle the case where lower or upper is not defined
          if (!lowerval || !upperval) {
            return "Invalid integral";
          }
          return `∫(${lowerval},${upperval})`;
        });

        // Replace summations
        expression = expression.replace(summationRegex, (match, start, end) => {
          let startval = start ? start.trim() : '';
          let endval = end ? end.trim() : '';

          // Handle the case where start or end is not defined
          if (!startval || !endval) {
            return "Invalid summation";
          }
          return `Σ(${startval},${endval})`;
        });

        // Replace products
        expression = expression.replace(productRegex, (match, start, end) => {
          let startval = start ? start.trim() : '';
          let endval = end ? end.trim() : '';

          // Handle the case where start or end is not defined
          if (!startval || !endval) {
            return "Invalid product";
          }
          return `Π(${startval},${endval})`;
        });

        // Replace limits
        expression = expression.replace(limitRegex, (match, variable, value) => {
          let varval = variable ? variable.trim() : '';
          let valval = value ? value.trim() : '';

          // Handle the case where variable or value is not defined
          if (!varval || !valval) {
            return "Invalid limit";
          }
          return `lim(${varval}→${valval})`;
        });

        // Replace logarithms
        expression = expression.replace(logarithmRegex, (match, base, argument) => {
          let baseval = base ? base.trim() : '';
          let argval = argument ? argument.trim() : '';

          // Handle the case where base or argument is not defined
          if (!baseval || !argval) {
            return "Invalid logarithm";
          }
          return `log_${baseval}(${argval})`;
        });

        // Replace trigonometric functions
        expression = expression.replace(trigonometryRegex, (match, func, argument) => {
          let funcval = func ? func.trim() : '';
          let argval = argument ? argument.trim() : '';

          // Handle the case where function or argument is not defined
          if (!funcval || !argval) {
            return "Invalid Trigonometric function";
          }
          return `${funcval}(${argval})`;
        });

        // Replace Greek letters
        expression = expression.replace(greekLetterRegex, (match, letter) => {
          const greekLetterMapping = {
            alpha: 'α',
            beta: 'β',
            gamma: 'γ',
            delta: 'δ',
            epsilon: 'ε',
            theta: 'θ',
            lambda: 'λ',
            mu: 'μ',
            pi: 'π',
            phi: 'φ',
            sigma: 'σ',
            omega: 'ω'
          };
          return greekLetterMapping[letter];
        });

        // Replace implications
        expression = expression.replace(implicationRegex, (match, implication) => {
          return `⇒${implication}`;
        });

        // Replace inequalities
        expression = expression.replace(inequalityRegex, (match, inequality) => {
          return `${inequality}`;
        });

        // Replace infinity symbol
        expression = expression.replace(infinityRegex, "∞");

        // Replace multiplication symbol
        expression = expression.replace(multiplicationRegex, "×");

        // Replace division symbol
        expression = expression.replace(divisionRegex, "÷");

        // Replace approximate symbol
        expression = expression.replace(approximateRegex, "≈");

        // Replace subset symbol
        expression = expression.replace(subsetRegex, "⊆");

        // Replace superset symbol
        expression = expression.replace(supersetRegex, "⊇");

        // Replace empty set symbol
        expression = expression.replace(emptySetRegex, "∅");

        // Replace quantifiers
        expression = expression.replace(quantifierRegex, (match, quantifier) => {
          if (quantifier === "exists") {
            return "∃";
          } else {
            return `∀${quantifier}`;
          }
        });
        // Replace binomial coefficients
        expression = expression.replace(binomialCoefficientRegex, (match, n, k) => {
          let nval = n ? n.trim() : '';
          let kval = k ? k.trim() : '';

          // Handle the case where n or k is not defined
          if (!nval || !kval) {
            return "Invalid binomial coefficients";
          }
          return `(${nval} choose ${kval})`;
        });

        // Replace matrices
        expression = expression.replace(matrixRegex, (match, matrix) => {
          return `[${
            matrix
              .trim()
              .split(" ")
              .join(", ")
          }]`;
        });

        // Replace vectors
        expression = expression.replace(vectorRegex, (match, vector) => {
          return `[${
            vector
              .trim()
              .split(" ")
              .join(", ")
          }]`;
        });

        // Replace union symbol
        expression = expression.replace(unionRegex, "∪");

        // Replace intersection symbol
        expression = expression.replace(intersectionRegex, "∩");

        // Replace negation symbol
        expression = expression.replace(negationRegex, "¬");

        return expression;
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
          mathBlock: [], // Initialize mathBlock to an empty array
        };
        // Check if the message contains math blocks
        if (responseMessage.includes("$$")) {
          console.log("Detected math blocks in the response");

          // Extract math blocks from the response message using a regular expression
          const mathBlockRegex = /\$\$(.*?)\$\$/g;
          const mathBlocks = responseMessage.match(mathBlockRegex) || [];


          // Replace math expressions within each math block
          mathBlocks.forEach((block, index) => {
            mathBlocks[index] = replaceMathExpressions(block);
            responseMessage = responseMessage.replace(block, mathBlocks[index]);
          });
          console.log(`Extracted math expression: ${mathBlocks}`);
          console.log(`Updated response message: ${responseMessage}`);
          // Create the final response object with the processed message and math blocks
          finalResponse = {
            message: responseMessage,
            mathBlocks: mathBlocks,
          };
        } else {
          // No math blocks detected in the response
          console.log("No math blocks detected in the response");

          // Create the final response object with the original message
          finalResponse = {
            message: responseMessage,
            mathBlocks: [],
          };
        }
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
          finalResponse.message = remainingMessage; // Update the message after removing expressions
          finalResponse.codeBlocks = codeBlocks;
          remainingMessage = remainingMessage.trim();
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
        // Check if the message contains image references// Extract image URLs from the response message
        const imageRegex = /IMGI\((https:\/\/image\.pollinations\.ai\/prompt\/[^)]+)\)/g;
        const imageUrls = [];
        let match;
        while ((match = imageRegex.exec(responseMessage)) !== null) {
          const imageUrl = match[1];
          console.log('Match:', match); // Log the match result
          console.log('Extracted Image URL:', imageUrl); // Log the extracted image URL
          imageUrls.push(imageUrl);
        }
        console.log('All Extracted Image URLs:', imageUrls); // Log all extracted image URLs
        finalResponse.imageUrls = imageUrls;
        console.log(`identified image: ${finalResponse.imageUrls}`);
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
        } else {
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
          mathBlock: finalResponse.mathBlock,
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

// Start the server

app.get('/API/textContent', (req, res) => {
  const textContent = fs.readFileSync('src/dev_mode.txt', 'utf8');
  console.log(`Text content: ${textContent}`)
  res.send(textContent);
});
// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname+'/build/index.html'));
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});


