import React from "react";

// ChatThreadList component: displays a list of chat threads
// It takes threads (array of thread data), activeThreadId (id of the currently active thread),
// and onSelectThread (function to handle when a thread is selected) as props
function ChatThreadList({ threads, activeThreadId, onSelectThread, onRemoveThread }) {
    return (
        <div className="chat-thread-list">
        {/* For each thread, create a div with a click handler that calls onSelectThread with the id of the thread */}
        {threads.map((thread) => (
            <div key={thread.id} className={`chat-thread-title ${thread.id === activeThreadId ? "active" : ""}`}>
            <span onClick={() => onSelectThread(thread.id)}>{thread.title}</span>
            <button onClick={() => onRemoveThread(thread.id)}>Remove</button>
            </div>
        ))}
        </div>
    );
    }
export default ChatThreadList;
