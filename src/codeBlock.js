import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { solarizedlight } from "react-syntax-highlighter/dist/esm/styles/prism";
import React from "react";
//codeBlock section
const CodeBlock = ({ code, language }) => {
  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(code);
  };
  return (
    <div className="message">
      <div className="code-block">
        <div className="code-block-header">
          <span className="language">{language}</span>
          <button className="copy-button" onClick={copyCodeToClipboard}>
            Copy Code
          </button>
        </div>
        <SyntaxHighlighter language={language} style={solarizedlight}>
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default CodeBlock;
