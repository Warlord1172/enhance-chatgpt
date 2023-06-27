// Importing the necessary dependencies and styles
import CodeBlock from "./codeblock";
import NumberSlider from "./temperature";
import "./App.css";
import "./normal.css";
import { Modal, Button } from "react-bootstrap";
import Avatar from './chatgptAvatar';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import { useState, useEffect } from "react"; // React's built-in hooks
import Alert from "react-bootstrap/Alert"; // Bootstrap Alert for error messages
import ChatThreadList from "./ChatThreadList";
import ResizableInput from "./ResizableTextArea";
//import TableComponent from "./tablecomponent";
import MarkdownIt from 'markdown-it';
import parse from 'html-react-parser';
import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";
//import axios from 'axios';
// Main application component
function App() {
  // Runs once after initial render to get AI model engines
  useEffect(() => {
    getEngines();
  });
  // Various state variables
  const [sessionId, setSessionId] = useState(null);
  const [openAIKeyFound, setOpenAIKeyFound] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [showOpenAIModal, setShowOpenAIModal] = useState(false);
  const [systemMessage, setSystemMessage] = useState(
    "You are a helpful assistant."
  ); // Default System message
  const [conversationHistory, setConversationHistory] = useState([]); // Conversation History
  const [currentThreadId, setCurrentThreadId] = useState(0); // Current thread ID
  const [errorMessage, setErrorMessage] = useState(""); // Error message
  const [showError, setShowError] = useState(false); // Flag for showing error
  const [input, setInput] = useState(""); // Current input
  const [Models, setModels] = useState([{ id: "Loading...", ready: false }]); // AI models
  const [currentModel, setCurrentModel] = useState("gpt-3.5-turbo"); // Selected AI model
  const [updatedSystemMessage, setUpdatedSystemMessage] = useState(false); //set System role
  const [submitConfirm, setSubmitConfirm] = useState("");
  const [temperature, setTemperature] = useState(0.5);
  const [tempTemperature, setTempTemperature] = useState(temperature); // temporary temperature state
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [openAIKey, setOpenAIKey] = useState(""); // Add a new state variable to store the input value

  // Generate a new session ID when the component first mounts
  useEffect(() => {
    setSessionId(uuidv4());
  }, []);
  // key handling
  // Update the input value in state whenever it changes
  const handleOpenAIKeyChange = (event) => {
    setOpenAIKey(event.target.value);
  };
  // The submit handler now uses the value from state
  const handleOpenAIKeySubmit = () => {
    console.log("OpenAI key submitted:", openAIKey);

    fetch(`/api/save-key`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key: openAIKey }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to save the key");
        }
        if (openAIKey === null) {
          setShowError(true);
          setErrorMessage(
            `An error has occurred: No OpenAI key was found, Please refresh the Window`
          );
        }
        setShowError(false);
        setOpenAIKeyFound(true); // Update the state variable to true
        setShowOpenAIModal(false); // Close the modal after submission
      })
      .catch((error) => {
        console.error("Error saving the key:", error);
      });
  };
  // Default chat log
  const [chatLog, setChatLog] = useState([
    {
      user: "assistant",
      message: "How can i help you today?",
    },
  ]);
  // Default chat threads
  const [chatThreads, setChatThreads] = useState([
    {
      id: 0,
      title: "Chat Room 1",
      chatLog: [
        {
          user: "assistant",
          message: "How can i help you today?",
        },
      ],
    },
  ]);
  // Runs whenever current thread ID or chat threads change
  useEffect(() => {
    const currentThread = chatThreads.find(
      (thread) => thread.id === currentThreadId
    );
    if (currentThread) {
      setChatLog(currentThread.chatLog);
    }
  }, [currentThreadId, chatThreads]);
  
  const downloadChat = (threadId) => {
  const thread = chatThreads.find((thread) => thread.id === threadId);
  if (thread) {
    const conversation = thread.chatLog.map((message) => `${message.user}: ${message.message}`).join('\n');
    const element = document.createElement('a');
    const file = new Blob([conversation], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `chat_${threadId}.txt`;
    element.click();
  }
};
  // Function to clear chat
  function clearChat() {
    setSessionId(uuidv4()); // generate a new session ID
    setChatThreads([
      ...chatThreads,
      {
        id: chatThreads.length,
        title: `Chat Room ${chatThreads.length + 1}`,
        chatLog: [
          {
            user: "assistant",
            message: "How can I help you today?",
          },
        ],
      },
    ]);
  }
  // Function to remove a chat thread
  function removeThread(threadId) {
    setChatThreads((prevThreads) =>
      prevThreads.filter((thread) => thread.id !== threadId)
    );
  }
  // Function to get AI model engines from the backend
  async function getEngines() {
    if (openAIKeyFound) {
      console.log("getEngines called");
      try {
        const response = await fetch(`/api/models`);
        if (!response.ok) {
          throw new Error("Failed to fetch models");
        }
        const data = await response.json();
        console.log("Received data from the backend:", data);
        if (!data.availableModels || data.availableModels.length === 0) {
          setModels([{ id: "No models available", ready: false }]);
        } else {
          const formattedModels = data.availableModels.map((model) => ({
            id: model,
            ready: true,
          }));
          setModels(formattedModels);
        }
        console.log("Models state updated:", Models);
      } catch (error) {
        console.error("Error fetching models:", error);
      }
    } else {
      console.error("No OpenAI key has been provided");
    }
  }
  // Runs when error message changes
  useEffect(() => {
    if (errorMessage) {
      setShowError(true);
      setErrorMessage(
        `An error has occurred: The AI just got up and left this server. Please reload the Window or change the language model for the AI.`
      );
    } else {
      setShowError(false);
    }
  }, [errorMessage]);

  // Runs when models state changes
  useEffect(() => {
    console.log("Models state changed:", Models);
  }, [Models]);

  // Runs when system role changes
  useEffect(() => {
    setUpdatedSystemMessage(false);
  }, [systemMessage]);
  // Function to handle form submission
  async function handleSubmit(e, inputValue) {
    // If an event is provided, prevent the default form submission event
    if (e) e.preventDefault();
    // Set the loading state to true
    setIsLoading(true);
    // Use the inputValue argument if it's provided, otherwise use input from the state
    const finalInput = inputValue || input;
    let chatLogNew = [...chatLog, { user: "me", message: finalInput }];
    console.log("input:", input); // Log the input value
    setInput("");
    const messages = chatLogNew.map((entry) => ({
      role: entry.user === "me" ? "user" : "assistant",
      content: entry.message,
    }));
    console.log("messages:", messages); // Log the prepared messages array
    setConversationHistory((prevHistory) => [
      ...prevHistory,
      {
        role: "user",
        content: input,
      },
    ]);
    if (conversationHistory.length > 5) {
      setConversationHistory((prevHistory) => prevHistory.slice(1));
    }
    try {
      const response = await fetch(
        `/api/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: input,
            currentModel: currentModel,
            isChatModel: currentModel.startsWith("gpt-"),
            systemRole: "system",
            systemMessage: systemMessage,
            updatedSystemMessage: updatedSystemMessage,
            conversationHistory: messages, // send the prepared messages array
            temperature: temperature,
            sessionId: sessionId, // include the sessionId here
          }),
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Raw response:", data); // Log the raw response data
      if (data.message) {
        chatLogNew = [
          ...chatLogNew,
          { user: "assistant", message: data.message },
        ];
      }
      // Check if the response includes a codeBlocks array
      if (data.codeBlocks && data.codeBlocks.length > 0) {
        // Iterate over each code block and add it to the chatLog
        data.codeBlocks.forEach((codeBlock) => {
          // Extract the language and code from the code block
          const { language, code } = codeBlock;
          // Add a codeBlock object to the chatLog instead of a regular message
          chatLogNew = [
            ...chatLogNew,
            { user: "assistant", codeBlocks: { language, code } },
          ];
        });
        console.log("chatLogNew with code block:", chatLogNew);
      } else {
        console.log("chatLogNew without code block:", chatLogNew);
      }
      setChatLog(chatLogNew);
      setChatThreads(
        chatThreads.map((thread) => {
          if (thread.id !== currentThreadId) return thread;
          return {
            ...thread,
            chatLog: chatLogNew,
          };
        })
      );
      // Set the loading state to false after receiving the response
      setIsLoading(false);
      setUpdatedSystemMessage(false);
    } catch (error) {
      console.error("An error occurred:", error); // Log any errors
      setErrorMessage(`Sorry, an error occurred: ${error.message}`);
    }
  }

  // Function to resize the window
  useEffect(() => {
    const setWindowSize = () => {
      const windowWidth = window.innerWidth * 0.8; // 80% of the browser window width
      const windowHeight = window.innerHeight * 0.8; // 80% of the browser window height
      window.resizeTo(windowWidth, windowHeight);
    };

    setWindowSize();
    window.addEventListener("resize", setWindowSize);

    return () => {
      window.removeEventListener("resize", setWindowSize);
    };
  }, []);
  useEffect(() => {
    const setWindowZoom = () => {
      document.documentElement.style.zoom = "80%";
    };

    setWindowZoom();
  }, []);
  // effect for temperature
  useEffect(() => {
    console.log("Temperature changed: ", temperature);
  }, [temperature]);
  const handletempSubmit = () => {
    setTemperature(tempTemperature); // update actual temperature state
  };
  // Function to handle closing the modal
  const handleCloseModal = () => {
    setShowModal(false);
    setShowOpenAIModal(true);
  };

  const handleCloseOpenAIModal = () => {
    setShowOpenAIModal(false);
  };
  // Render the application
  return (
    <div className="App">
      {/* Other parts of your application */}
      {/* Modal for introduction and login options */}
      <Modal show={showModal} onHide={handleCloseModal} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Welcome to the ChatGPT Playground!</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            <center>
              The ChatGPT Playground is an interactive AI tool, allowing users
              to delve into detailed dialogues across a myriad of topics. It's
              not just for entertainment, but also a resource for education,
              brainstorming, and problem-solving. Have fun!
            </center>
          </p>
        </Modal.Body>
        <Modal.Footer>
          {
            //<GoogleSignInButton />
          }
          <Button variant="secondary" onClick={handleCloseModal}>
            Continue
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal
        show={showOpenAIModal}
        onHide={handleCloseOpenAIModal}
        backdrop="static"
      >
        <Modal.Title>Enter OpenAI Key</Modal.Title>
        <Modal.Body>
          <p>Please enter your OpenAI key:</p>
          <input
            type="text"
            onChange={handleOpenAIKeyChange} // Update this
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={handleOpenAIKeySubmit} // Update this
          >
            Submit
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Loading popup */}
      {isLoading && (
        <div className="loading-popup">
          <div className="loading-animation"></div>
          <p className="loading-text">Generating message and updating log...</p>
        </div>
      )}
      <Alert
        className="Alert-Notif"
        variant="danger"
        show={showError}
        onClose={() => setShowError(false)}
        dismissible
      >
        <Alert.Heading>Error</Alert.Heading>
        <p>{errorMessage}</p>
      </Alert>
      <aside className="sidemenu">
        <div className="side-menu-button" onClick={clearChat}>
          <span>+</span>
          New Chat
        </div>
        <header className="model-header">
          <p>
            Selected Model:{" "}
            <span style={{ color: "green" }}>{currentModel}</span>
          </p>
        </header>
        <div className="models">
          {Models.length > 0 ? (
            <select
              className="Model-list"
              onChange={(e) => {
                console.log("setting to..", e.target.value);
                setCurrentModel(e.target.value);
              }}
            >
              {Models.map((model) => (
                <option key={model.id} value={model.id} disabled={!model.ready}>
                  {model.id}
                </option>
              ))}
            </select>
          ) : (
            <p>Loading models...</p>
          )}
        </div>
        <div className="system-message-settings">
          <p>System Message Settings</p>
          <div>
            <label>Content: </label>
            <textarea
              placeholder={systemMessage}
              onChange={(e) => setSystemMessage(e.target.value)}
            />
          </div>
          <NumberSlider
            minValue={0}
            maxValue={1}
            initialValue={tempTemperature}
            onChange={setTempTemperature}
          />
          <button
            onClick={() => {
              handletempSubmit();
              console.log(systemMessage);
              setUpdatedSystemMessage(true);
              setSubmitConfirm("Changes have been submitted");
              console.log(`temperature set to: ${temperature}`);
            }}
            className="System-Submit-Button"
          >
            Update System Message
          </button>

          <div className="confirm-msg">
            {updatedSystemMessage && submitConfirm}
          </div>
        </div>
        <ChatThreadList
          threads={chatThreads}
          activeThreadId={currentThreadId}
          onSelectThread={(id) => setCurrentThreadId(id)}
          onRemoveThread={removeThread}
          onHoverThread={downloadChat}
        />
        {
          //<GoogleSignInButton />
        }
      </aside>
      <section className="chatbox">
        <div className="chat-log">
          {chatLog.map((message, index) => {
            if (message.codeBlocks) {
              return (
                <CodeBlock
                  key={index}
                  code={message.codeBlocks.code}
                  language={message.codeBlocks.language}
                />
              );
            } else {
              return <ChatMessage key={index} message={message} />;
            }
          })}
        </div>
        <div className="chat-input-holder">
          <form onSubmit={handleSubmit}>
            <ResizableInput
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="chat-input-textarea"
              placeholder="Insert Text Here..."
              handleSubmit={(value) => handleSubmit(null, value)}
            />
          </form>
          <p>
            This project may produce inaccurate information about people,
            places, or facts. User discretion is advised.
          </p>
        </div>
      </section>
    </div>
  );
}
const ChatMessage = ({ message }) => {
  const md = new MarkdownIt();

  const extractTables = (markdownString) => {
    const htmlString = md.render(markdownString);
    const htmlElements = parse(htmlString);

    return htmlElements.filter((element) => element.type === "table");
  };

  const isChatGPT = message.user === "assistant"; // Determine if the message is from ChatGPT

  if (message.codeBlocks) {
    return (
      <div className={`chat-message ${isChatGPT && "chatgpt"}`}>
        <div className="chat-message-center">
          <div className={`avatar ${isChatGPT && "chatgpt"}`}>
            {isChatGPT ? (
              <Avatar isChatGPT={true} />
            ) : (
              <Avatar isChatGPT={false} />
            )}
          </div>
          <div className="message">
            <ReactMarkdown>{message.message}</ReactMarkdown>
            <CodeBlock
              code={message.codeBlocks.code}
              language={message.codeBlocks.language}
            />
          </div>
        </div>
      </div>
    );
  } else {
    const markdownString = message.message;
    const tables = extractTables(markdownString);

    return (
      <div className={`chat-message ${isChatGPT && "chatgpt"}`}>
        <div className="chat-message-center">
          <div className={`avatar ${isChatGPT && "chatgpt"}`}>
            {isChatGPT ? (
              <Avatar isChatGPT={true} />
            ) : (
              <Avatar isChatGPT={false} />
            )}
          </div>
          <div className="message">
            <ReactMarkdown>{message.message}</ReactMarkdown>
            <div className="Table">
              {tables.map((table, index) => (
                <div key={index}>{table}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
};
export default App;

