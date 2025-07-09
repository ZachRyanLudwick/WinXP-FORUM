import React, { useState, useRef, useEffect } from 'react';

const Terminal = ({ onOpenCV, onClose }) => {
  const [history, setHistory] = useState([
    'Microsoft Windows XP [Version 5.1.2600]',
    '(C) Copyright 1985-2001 Microsoft Corp.',
    'Use command help for more information.',
    '',
    'C:\\>'
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [clearing, setClearing] = useState(false);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  const commands = {
    help: {
      description: 'Display available commands',
      execute: () => [
        'Available commands:',
        '  HELP     - Display this help message',
        '  CV       - Display my resume/CV',
        '  CLS      - Clear the screen',
        '  DIR      - List directory contents',
        '  DATE     - Display current date',
        '  TIME     - Display current time',
        '  VER      - Display version information',
        '  EXIT     - Close terminal'
      ]
    },
    cv: {
      description: 'Display resume/CV',
      execute: () => {
        onOpenCV();
        return ['Opening CV...'];
      }
    },
    cls: {
      description: 'Clear screen',
      execute: () => {
        setClearing(true);
        return [];
      }
    },
    dir: {
      description: 'List directory contents',
      execute: () => [
        ' Volume in drive C has no label.',
        ' Volume Serial Number is 1234-5678',
        '',
        ' Directory of C:\\',
        '',
        '12/15/2024  10:30 AM    <DIR>          Documents',
        '12/15/2024  10:30 AM    <DIR>          Programs',
        '12/15/2024  10:30 AM    <DIR>          System',
        '12/15/2024  10:30 AM         1,024 CV.html',
        '               1 File(s)          1,024 bytes',
        '               3 Dir(s)  15,728,640 bytes free'
      ]
    },
    date: {
      description: 'Display current date',
      execute: () => [`The current date is: ${new Date().toLocaleDateString()}`]
    },
    time: {
      description: 'Display current time',
      execute: () => [`The current time is: ${new Date().toLocaleTimeString()}`]
    },
    ver: {
      description: 'Display version',
      execute: () => ['Microsoft Windows XP [Version 5.1.2600]']
    },
    exit: {
      description: 'Close terminal',
      execute: () => {
        setTimeout(() => onClose(), 500);
        return ['Goodbye!'];
      }
    }
  };

  const executeCommand = (cmd) => {
    const command = cmd.toLowerCase().trim();
    const commandObj = commands[command];
    
    if (commandObj) {
      const output = commandObj.execute();
      return output;
    } else if (command === '') {
      return [];
    } else {
      return [`'${cmd}' is not recognized as an internal or external command,`, 'operable program or batch file.'];
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      const commandText = currentInput;
      const output = executeCommand(commandText);

      if (commandText.toLowerCase() === 'cls') {
        setTimeout(() => {
          setHistory(['C:\\>']);
          setClearing(false);
        }, 500);
      } else {
        setHistory([
          ...history,
          `C:\\>${commandText}`,
          ...output,
          'C:\\>'
        ]);
      }

      setCurrentInput('');
    }
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history, clearing]);

  useEffect(() => {
    if (inputRef.current && !clearing) {
      inputRef.current.focus();
    }
  }, [clearing]);

  return (
    <div className="terminal" onClick={() => inputRef.current?.focus()}>
      <div
        className="terminal-content"
        ref={terminalRef}
        style={{
          transition: 'opacity 0.5s ease',
          opacity: clearing ? 0 : 1,
          maxHeight: '400px',
          overflowY: 'auto',
          userSelect: clearing ? 'none' : 'auto',
        }}
      >
        {history.map((line, index) => (
          <div key={index} className="terminal-line">
            {line === 'C:\\>' ? (
              <div className="terminal-prompt" style={{ display: 'flex', alignItems: 'center' }}>
                <span className="prompt-text">C:\&gt;</span>
                {index === history.length - 1 && !clearing && (
                  <input
                    ref={inputRef}
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="terminal-input"
                    autoFocus
                  />
                )}
              </div>
            ) : (
              <span>{line}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Terminal;
