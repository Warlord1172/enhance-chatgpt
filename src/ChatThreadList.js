import React, { useState } from "react";

// ChatThreadList component: displays a list of chat threads
// It takes threads (array of thread data), activeThreadId (id of the currently active thread),
// onSelectThread (function to handle when a thread is selected), and onRemoveThread (function to handle when a thread is removed) as props
function ChatThreadList({ threads, activeThreadId, onSelectThread, onRemoveThread }) {
  const [hoveredThreadId, setHoveredThreadId] = useState(null);

  const handleHoverThread = (threadId) => {
    setHoveredThreadId(threadId);
  };

  const handleDownloadChat = (threadId) => {
    const thread = threads.find((thread) => thread.id === threadId);
    if (thread) {
      // Extract the conversation from the thread and initiate the download
      const conversation = thread.chatLog.map((message) => `${message.user}: ${message.message}`).join('\n');
      const element = document.createElement('a');
      const file = new Blob([conversation], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `chat_${threadId}.txt`;
      element.click();
    }
  };

  return (
    <div className="chat-thread-list">
      {/* For each thread, create a div with hover and click handlers */}
      {threads.map((thread) => (
        <div
          key={thread.id}
          className={`chat-thread-title ${thread.id === activeThreadId ? "active" : ""}`}
          onMouseEnter={() => handleHoverThread(thread.id)}
          onMouseLeave={() => handleHoverThread(null)}
        >
          <span onClick={() => onSelectThread(thread.id)}>
            {thread.title}
            {hoveredThreadId === thread.id && (
              <button className="download-button" onClick={() => handleDownloadChat(thread.id)}>
                Download
              </button>
            )}
          </span>
          <button onClick={() => onRemoveThread(thread.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}

export default ChatThreadList;