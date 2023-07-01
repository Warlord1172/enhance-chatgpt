import './loading.css';

const Loading = () => {
  return (
    <div className="main-loading-container">
      <div className="main-loading-animation">
        <span></span>
        <span></span>
        
        <span></span>
        <span></span>
      </div>
      <div className="main-loading-text">Deploying Application, please wait.</div>
    </div>
  );
};

export default Loading;