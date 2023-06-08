import React from 'react';

const CodeBlock = ({ code, language }) => {
  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="message">
      <div className="code-block">
        <div className="code-block-header">
          <span className="language">{language}</span>
          <button className="copy-button" onClick={copyCodeToClipboard}>Copy Code</button>
        </div>
        <pre><code>
          {code}
        </code></pre>
      </div>
    </div>
  );
};

export default CodeBlock;
