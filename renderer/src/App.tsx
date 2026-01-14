import React, { useState } from 'react';
import { Button } from './components/ui/button';

function App() {
    const [msg, setMsg] = useState('');

    const upload = async () => {
        const response = await (window as any).electronAPI.uploadFile('C:/Users/esker/Desktop/test.txt');
        setMsg(response);
    };

    return (
        <div>
            <h1>Electron + React + TS</h1>
            <Button onClick={upload}>Upload File</Button>
            <p>{msg}</p>
        </div>
    );
}

export default App;