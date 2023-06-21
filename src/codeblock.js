import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { okaidia } from "react-syntax-highlighter/dist/esm/styles/prism";
import React from "react";

//codeBlock section
const CodeBlock = ({ code, language }) => {
  return (
    <div className="message">
      <div className="code-block">
        <div className="code-block-header">
          <span className="language">{language}</span>
          <button
            className="copy-button"
            onClick={() => {
              navigator.clipboard.writeText(code);
              document.querySelector(".copy-button").innerText = "Code Copied";
            }}
          >
            Copy Code
          </button>
        </div>
        <SyntaxHighlighter language={language} style={okaidia}>
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default CodeBlock;
