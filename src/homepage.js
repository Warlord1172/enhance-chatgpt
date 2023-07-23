function HomePage() {
  const paragraph = `
        #include <iostream>
        int main() {
            std::cout << "Hello, World!" << std::endl;
        return 0;
        }
        `;
  return (
    <div className="homepage">
      <div className="box">
        <h2>Introduction</h2>
        <p>How does ChatGPT work?</p>
        <p>
          ChatGPT is a form of language model that uses advanced natural
          language processing techniques to generate human-like text responses
          based on given input. It is trained on a vast amount of text data to
          learn patterns, grammar, and context in order to generate coherent and
          relevant responses.
        </p>
        <p>
          When you interact with ChatGPT, your input is processed and used to
          generate a response based on the learned patterns and knowledge of the
          model. The model takes into account the context of the conversation
          and tries to provide helpful and informative answers.
        </p>
        <p>
          It's important to note that while ChatGPT can generate impressive
          responses, it is not perfect and may sometimes produce incorrect or
          nonsensical answers. It's always a good idea to critically evaluate
          the responses and use your own judgment.
        </p>
      </div>
      <div className="box">
        <h2>Examples:</h2>
        <p>Here are ways you can use this Project</p>
        <p>Question: what is C++?</p>
        <p>
          <strong>
            Answer: C++ is a powerful, general-purpose programming language that
            was developed as an extension of the C programming language. It was
            created with the goal of providing additional features and
            capabilities while maintaining compatibility with C. C++ supports
            both procedural and object-oriented programming paradigms, allowing
            developers to write efficient and high-performance code. It is
            widely used in various domains, including software development, game
            development, embedded systems, and more. C++ is known for its
            flexibility, performance, and extensive libraries, making it a
            popular choice among programmers.
          </strong>
        </p>
        <p>Question: make a example script of hello world in C++?</p>
        <strong>
          <p>
            Answer: Certainly! Here's an example of a simple "Hello, World!"
            program written in C++:
          </p>
          <pre style={{ textAlign: "left" }}>
            <p>{paragraph}</p>
          </pre>
          <p>
            In this program, we include the iostream header, which provides
            input/output stream functionality. The main function is the entry
            point of the program, and within it, we use std::cout to output the
            "Hello, World!" message to the console. Finally, we return 0 to
            indicate successful program execution. You can compile and run this
            program using a C++ compiler.
          </p>
          <p>
            <strong>
              Note: this also generates an code snippet window that allows you
              to copy the code through a button
            </strong>
          </p>
        </strong>
        <p>Question: Generate me a table</p>
        <strong>
          <p>Answer: `Generates a table depending on user choice`</p>
        </strong>
      </div>
      <div className="box">
        <h2>Getting Started</h2>
        <p>How to get started?</p>
        <p>
          To begin utilizing this project, kindly navigate to the left side menu
          and select the option labeled "New Chat". By doing so, a chat room
          will be generated exclusively for your access and usage. Subsequently,
          it is imperative that you proceed to activate the desired Chat room by
          selecting it, following which you may commence with your textual
          interactions by typing away.
        </p>
      </div>
    </div>
  );
}
export default HomePage;
