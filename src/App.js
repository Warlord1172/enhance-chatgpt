// Importing the necessary dependencies and styles
import CodeBlock from "./codeblock";
import NumberSlider from "./temperature";
import "./App.css";
import "./normal.css";
import "./loading.css";
import './homepage.css';
import HomePage from "./homepage";
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
import Loading from "./loadinganimation";
//import fs from 'fs';
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
  const [systemMessage, setSystemMessage] = useState("You are a helpful assistant."); // Default System message
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
  const [isMenuOpen, setIsMenuOpen] = useState(false); // hamburger menu
  const [isGuest,setGuest] = useState(false);
  const [modelTokenLimits, setModelTokenLimits] = useState(null); // Model Token Limit
  const [isMenuMaxWidth, setIsMenuMaxWidth] = useState(false);// menu width
  const [showHomepage, setShowHomepage] = useState(false); //homepage
  // Generate a new session ID when the component first mounts
  useEffect(() => {
    setSessionId(uuidv4());
  }, []);
  // hamburger menu
  const toggleMenu = () => {
    const hamburger = document.querySelector('.hamburger');
    if(!isGuest){
      setIsMenuOpen(!isMenuOpen);
      if(!isMenuOpen){
        hamburger.classList.add('is-open');
      }else{
        hamburger.classList.remove('is-open');
      }
    }
    else{
      
      setShowError(true);
      setErrorMessage("Guest has limited features, please insert an OpenAI key to access these features.");
    }
  };
  // key handling
  // Update the input value in state whenever it changes
  const handleOpenAIKeyChange = (event) => {
    setOpenAIKey(event.target.value);
  };
  // The submit handler now uses the value from state
  const handleOpenAIKeySubmit = () => { 
    if (openAIKey !== '') {
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
          setShowError(false);
          setOpenAIKeyFound(true);
          setShowOpenAIModal(false);
        })
        .catch((error) => {
          //console.error("Error saving the key:", error);
        });
    } else {
      setShowError(true);
      setErrorMessage("An error has occurred: No OpenAI key was found. Please refresh the window.");
    }
  };
  // handle guest login
  const handleGuestSubmit = () => {
    setGuest(true);
    fetch(`/api/save-key`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key: "69" }),
    }) // Autofill the input form with the default value
    .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to save the key");
          }
          setShowError(false);
          setOpenAIKeyFound(true);
          setShowOpenAIModal(false);
        })
        .catch((error) => {
          //console.error("Error saving the key:", error);
        });
  }
   // Default chat log
  const [chatLog, setChatLog] = useState([
    {
      user: "assistant",
      message: "How can I help you today?",
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
          message: "How can I help you today?",
        },
        {
          user: "assistant",
          message:
            "To make an image, copy/paste this command: 'say [IMGI(https://image.pollinations.ai/prompt/{description}) with the description __ ]'",
        },
        {
          user: "assistant",
          message:
            "Note: replace __ with the actual description you would like. if it does not work, use a different language model or change its behavior and try again.",
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
    const newThreadId = chatThreads.length > 0 ? chatThreads[chatThreads.length - 1].id + 1 : 0;
    setSessionId(uuidv4()); // generate a new session ID
    setChatThreads([
      ...chatThreads,
      {
        id: newThreadId,
        title: `Chat Room ${newThreadId + 1}`,
        chatLog: [
          {
            user: "assistant",
            message: "How can I help you today?",
          },
          {
            user: "assistant",
            message:
              "To make an image, copy/paste this command: 'say [IMGI(https://image.pollinations.ai/prompt/{description}) with the description __ ]'",
          },
          {
            user: "assistant",
            message:
              "Note: replace __ with the actual description you would like. if it does not work, use a different language model or change its behavior and try again.",
          },
        ],
      },
    ]);
    setShowHomepage(false);
  }
  // Function to remove a chat thread
  function removeThread(threadId) {
    let newThreads = chatThreads.filter((thread) => thread.id !== threadId);
    let newCurrentThreadId = currentThreadId;
  
    // If the active chat room is removed
    if (threadId === currentThreadId) {
      const currentIndex = chatThreads.findIndex((thread) => thread.id === threadId);
  
      // If there are remaining chat rooms
      if (newThreads.length > 0) {
        // If the removed chat room was the last one, select the previous chat room
        if (currentIndex === newThreads.length) {
          newCurrentThreadId = newThreads[currentIndex - 1].id;
        }
        // If the removed chat room was not the last one, select the next chat room
        else {
          newCurrentThreadId = newThreads[currentIndex].id;
        }
      }
      // If there are no remaining chat rooms, set the current thread ID to 0 and show the homepage
      else {
        newCurrentThreadId = 0;
        setShowHomepage(true);
      }
    }
  
    setChatThreads(newThreads);
    setCurrentThreadId(newCurrentThreadId);
  }
  // Function to get AI model engines from the backend
  async function getEngines() {
    if (openAIKeyFound) {
      try {
        const response = await fetch(`/api/models`);
        if (!response.ok) {
          throw new Error("Failed to fetch models");
        }
        const data = await response.json();
        if (!data.availableModels || data.availableModels.length === 0) {
          setModels([{ id: "No models available", ready: false }]);
        } else {
          const formattedModels = data.availableModels.map((model) => ({
            id: model,
            ready: true,
          }));
          setModels(formattedModels);
        }
        // Get the token limit for the current model
        const currentModelData = data.availableModels.find(
          (model) => model.id === currentModel
        );
        if (currentModelData) {
          setModelTokenLimits(currentModelData.safeTokensForCompletion);
        }
  
        // Fetch the model token limits
        const tokenLimitsResponse = await fetch("/api/get-model-token-limits", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ currentModel }),
        });
        if (!tokenLimitsResponse.ok) {
          throw new Error("Failed to fetch model token limits");
        }
        const tokenLimitsData = await tokenLimitsResponse.json();
        // Update the model token limits state variable
        setModelTokenLimits(tokenLimitsData.safeTokensForCompletion);
      } catch (error) {
      }
    } else {
      setShowError(true);
      setErrorMessage("No OpenAI key has been provided");
    }
  }
  // Runs when error message changes
  useEffect(() => {
    if (errorMessage) {
      setShowError(true);
      
    } else {
      setShowError(false);
    }
  }, [errorMessage]);

  // Runs when models state changes
  useEffect(() => {
  }, [Models]);
  // Runs when current model changes
  useEffect(() => {
  }, [currentModel]);
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
    // Check if the finalInput exceeds the message limit
    const isExceedingLimit = calculateMessageLimit(finalInput);
    if (isExceedingLimit) {
      setShowError(true);
      setErrorMessage("Message limit exceeded. Please modify your message before proceeding.");
      setIsLoading(false);
      return; // do not continue
    }
    let chatLogNew = [...chatLog, { user: "me", message: finalInput }];
    setInput("");
    const messages = chatLogNew.map((entry) => ({
      role: entry.user === "me" ? "user" : "assistant",
      content: entry.message,
    }));
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
        `https://chatgpt-unleashed.onrender.com/api/chat`,
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
      //console.error("An error occurred:", error); // Log any errors
      setShowError(true);
      setErrorMessage(
        `${error.message}, The AI have Collapsed. Please refresh Window.`
      );
    }
  }
  // chat log functions
  const scrollToBottom = () => {
    const chatBoxSection = document.querySelector('.Chat-box-section');
    if (chatBoxSection) {
      chatBoxSection.scrollTo({
        top: chatBoxSection.scrollHeight,
        behavior: "smooth",
      });
    }
  };

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
  // Add a useEffect hook to check the menu width on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMenuMaxWidth(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Check the menu width on initial load

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  // effect for temperature
  useEffect(() => {
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
  // App loading 
  const [apploading, setapploading] = useState(true);
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      setapploading(false);
    }, 3000); // Simulating a 3-second loading delay

    return () => clearTimeout(loadingTimeout);
  }, []);
  // function to calculate message limit
  // message limit function
  const calculateMessageLimit = (message) => {
    // Check if the message is empty or consists of whitespace only
    const isEmptyMessage = message.trim() === "";
    if (isEmptyMessage) {
      // Update the placeholder element for empty message
      const placeholderElement = document.getElementById("calculated-message");
      placeholderElement.textContent = "Message is empty";
      placeholderElement.style.color = "white";
      return false; // Return false if message is empty
    }
    // Check if the message exceeds the token limit
    const messageTokens = message.trim().split(" ").length;
    const isExceedingLimit = messageTokens > modelTokenLimits;
    // Update the placeholder text based on the message length
    const placeholderText = isExceedingLimit
      ? "Message is too long, shorten it"
      : "Ready to Submit";
    // Update the placeholder color based on the message length
    const placeholderColor = isExceedingLimit ? "red" : "green";
    // Update the placeholder element
    const placeholderElement = document.getElementById("calculated-message");
    placeholderElement.textContent = placeholderText;
    placeholderElement.style.color = placeholderColor;
  
    return isExceedingLimit; // Return the value of isExceedingLimit
  };
  // Render the application
  return (
  <div className="app-loading-container">
    {apploading ? <Loading /> :
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
              <p>
                Get your OpenAI Key here:{" "}
                <a href="https://platform.openai.com/account/api-keys">
                  https://platform.openai.com/account/api-keys
                </a>
              </p>
              <p>Please enter your OpenAI key:</p>
              <input
                type="Password"
                onChange={handleOpenAIKeyChange} // Update this
              />
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={handleGuestSubmit}
              >
                Continue as Guest
              </Button>
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
      {/* Side menu */}
      {isMenuOpen && (
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
              setUpdatedSystemMessage(true);
              setSubmitConfirm("Changes have been submitted");
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
      )}
      {/* Hamburger menu button */}
      <button className="hamburger" onClick={toggleMenu}>
        <span className="line"></span>
        <span className="line"></span>
        <span className="line"></span>
      </button>
      {showHomepage ? (
            <HomePage />
          ) : (
      <div className={`Chat-box-section`}>
      <section className="chatbox">
        <button className={`scroll-to-latest ${isMenuMaxWidth ? "" : "visible"}`} onClick={scrollToBottom}>
            Scroll to Latest
          </button>
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
      </section>
      <div className="chat-input-holder">
          <form onSubmit={handleSubmit}>
            <ResizableInput
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                calculateMessageLimit(e.target.value); // Call calculateMessageLimit function
              }}
              className="chat-input-textarea"
              placeholder="Insert Text Here..."
              handleSubmit={(value) => handleSubmit(null, value)}
            />
            <p className="calculated-message"id="calculated-message">
                <span style={{ color: "white" }}>Start Typing</span>
              </p>
          </form>
          <p>
            This project may produce inaccurate information about people,
            places, or facts. User discretion is advised.
          </p>
        </div>  
      </div>
      )}
    </div>
    }
    </div>
    );
};
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
            {message.imageUrls && message.imageUrls.length > 0 && (
              <div className="image-section">
                {message.imageUrls.map((imageUrl, index) => (
                  <img
                    src={imageUrl}
                    key={index}
                    alt={`drawing ${index + 1}`}
                  />
                ))}{message.imageUrls.length === 0 && (
                  <div className="loading-spinner">
                    {" "}
                    <img
                      src="https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif"
                      alt="loading spinner"
                    />{" "}
                  </div>
                )}
              </div>
            )}
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

