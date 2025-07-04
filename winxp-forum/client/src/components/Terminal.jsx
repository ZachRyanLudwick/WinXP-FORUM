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
        setHistory(['C:\\>']);
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
      const output = executeCommand(currentInput);
      const newHistory = [
        ...history,
        `C:\\>${currentInput}`,
        ...output,
        'C:\\>'
      ];
      setHistory(newHistory);
      setCurrentInput('');
    }
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="terminal" onClick={() => inputRef.current?.focus()}>
      <div className="terminal-content" ref={terminalRef}>
        {history.map((line, index) => (
          <div key={index} className="terminal-line">
            {line === 'C:\\>' ? (
              <div className="terminal-prompt">
                <span className="prompt-text">C:\&gt;</span>
                {index === history.length - 1 && (
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