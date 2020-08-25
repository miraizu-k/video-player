import React, {useState} from 'react';
import './App.css';
import ReactPlayer from "react-player";
import {Duration} from "./Duration";

function App() {
  const [url, setUrl] = useState('https://www.youtube.com/watch?v=OfIQW6s1-ew');
  const [nowSeek, setSeek] = useState(0);
  const setUrlHandler = (event) => {
    setUrl(event.target.nextElementSibling.value);
  };
  const seekHandler = (e) => {
      setSeek(e.playedSeconds);
  };
  return (
    <div className="App">
      <div className="input-box">
        <button onClick={setUrlHandler} type="button">URL変更</button><input id="play-url" type="text" defaultValue={url} />
      </div>
      <ReactPlayer url={url} className="player" onProgress={seekHandler} progressInterval={250} />
      <div>
          <Duration seconds={nowSeek} />
      </div>
    </div>
  );
}

export default App;
