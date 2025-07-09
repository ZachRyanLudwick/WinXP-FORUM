import React from 'react';

        // <p style="margin: 5px 0; color: #666;">
        //   📧 your.email@example.com | 🌐 yourwebsite.com | 💼 LinkedIn
        // </p>

const CV = () => {
  const cvHTML = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: white;">
      <header style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="margin: 0; color: #333; font-size: 2.5em;">Zach Ludwick</h1>
        <p style="margin: 5px 0; color: #666; font-size: 1.1em;">Full-Stack Developer & Cybersecurity Researcher</p>
        
      </header>

      <section style="margin-bottom: 30px;">
        <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Profile Summary</h2>
        <p style="line-height: 1.6; color: #555;">
          Hands-on ethical hacker and full-stack developer with a deep interest in cybersecurity, reverse engineering, and secure application design. Skilled in building encrypted platforms, stealth malware testing, and real-time communication tools. Practical experience across Windows, macOS, and embedded hardware like Raspberry Pi.
        </p>
      </section>

      <section style="margin-bottom: 30px;">
        <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Technical Skills</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
          <div>
            <h4 style="margin: 0 0 10px 0; color: #444;">Languages & Frameworks</h4>
            <p style="margin: 0; color: #666;">JavaScript (React, Node.js), Python (Flask), HTML/CSS (Tailwind), Bash</p>
          </div>
          <div>
            <h4 style="margin: 0 0 10px 0; color: #444;">Database & Protocols</h4>
            <p style="margin: 0; color: #666;">MongoDB, WebSockets, WebRTC, REST APIs, Express.js</p>
          </div>
          <div>
            <h4 style="margin: 0 0 10px 0; color: #444;">Security Tools & Concepts</h4>
            <p style="margin: 0; color: #666;">Wireshark, Docker, PBKDF2, bcrypt, JWT, SMM injection, E2EE, Linux, VMs</p>
          </div>
          <div>
            <h4 style="margin: 0 0 10px 0; color: #444;">Deployment & DevOps</h4>
            <p style="margin: 0; color: #666;">Vite, Firebase, Nginx, GitHub Actions, Raspberry Pi</p>
          </div>
        </div>
      </section>

      <section style="margin-bottom: 30px;">
        <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Cybersecurity Practices</h2>
        <ul style="color: #555; line-height: 1.6; padding-left: 20px;">
          <li><strong>Malware Analysis & Reverse Engineering:</strong> Analyzed tools like XenoRAT in sandboxed VMs, studying AV/EDR evasion, stealth techniques, and persistence using custom crypters and System Management Mode (SMM) injection.</li>
          <li><strong>Encrypted Systems:</strong> Built real-time E2EE messaging apps with client-side keypair generation, PBKDF2-encrypted private keys, and zero-knowledge cloud backups.</li>
          <li><strong>Authentication & Session Security:</strong> Developed secure login systems with invite-only access, rate limiting, JWT (HttpOnly cookies), auto-expiring sessions, and device management with key revocation support.</li>
          <li><strong>File Upload Hardening:</strong> Mitigated web upload vulnerabilities via strict MIME type and extension validation, sandboxing, and upload sanitization.</li>
          <li><strong>Red Team Simulation:</strong> Conducted simulated phishing, remote payload execution, and persistence experiments in testbed environments.</li>
          <li><strong>Privacy & Data Control:</strong> Implemented self-destructing messages (24h), auto-deleting accounts after inactivity, and metadata stripping on uploads.</li>
        </ul>
      </section>

      <section style="margin-bottom: 30px;">
        <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Projects</h2>

        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 5px 0; color: #333;">Tinq – Encrypted Messaging Platform</h3>
          <p style="margin: 0 0 10px 0; color: #666; font-style: italic;">React, Vite, Node.js, Express, MongoDB, WebRTC</p>
          <p style="color: #555; line-height: 1.6;">
            WhatsApp/Discord-style app with full E2EE support, self-destructing messages, device management, session expiry, and zero-knowledge message storage. Includes master password encryption and public/private key infrastructure.
          </p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 5px 0; color: #333;">XPLOIT HUB – Cybersecurity Forum</h3>
          <p style="margin: 0 0 10px 0; color: #666; font-style: italic;">Node.js, React, Tailwind, MongoDB</p>
          <p style="color: #555; line-height: 1.6;">
            A Windows XP-style forum with file uploads, DMs, and a custom karma system. Designed for cybersec researchers to share exploits and notes in a nostalgic desktop UI.
          </p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 5px 0; color: #333;">Real-Time WebRTC Screen Sharing</h3>
          <p style="margin: 0 0 10px 0; color: #666; font-style: italic;">JavaScript, WebRTC, Node.js</p>
          <p style="color: #555; line-height: 1.6;">
            Ultra-low-latency browser viewer with fullscreen toggle, live preview, and no control access for viewers. Includes automatic audio/video stream start.
          </p>
        </div>

        <div>
          <h3 style="margin: 0 0 5px 0; color: #333;">Custom Crypter & Payload System</h3>
          <p style="margin: 0 0 10px 0; color: #666; font-style: italic;">Nim, Python, Batch, Windows APIs</p>
          <p style="color: #555; line-height: 1.6;">
            Built a crypter for ethical malware testing using silent service installation, runtime payload decryption, registry-based persistence, and stealth AV bypass research techniques.
          </p>
        </div>
      </section>
    </div>

  `;

  return (
    <div className="cv-container">
      <div dangerouslySetInnerHTML={{ __html: cvHTML }} />
    </div>
  );
};

export default CV;