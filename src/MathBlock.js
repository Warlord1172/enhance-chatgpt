import React, { useEffect } from "react";
import MathJax from "react-mathjax";

const MathBlock = ({ expressions }) => {
  useEffect(() => {
    MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
  }, [expressions]);

  return (
    <div className="math-block">
      {expressions.map((expression, index) => (
        <MathJax.Provider key={index} input="tex">
          <div>
            <MathJax.Node>{expression}</MathJax.Node>
          </div>
        </MathJax.Provider>
      ))}
    </div>
  );
};

export default MathBlock;