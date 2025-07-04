import React from 'react';

const CV = () => {
  const cvHTML = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: white;">
      <header style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="margin: 0; color: #333; font-size: 2.5em;">Your Name</h1>
        <p style="margin: 5px 0; color: #666; font-size: 1.1em;">Full Stack Developer</p>
        <p style="margin: 5px 0; color: #666;">
          📧 your.email@example.com | 📱 +1 (555) 123-4567 | 🌐 yourwebsite.com | 💼 LinkedIn
        </p>
      </header>

      <section style="margin-bottom: 30px;">
        <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Professional Summary</h2>
        <p style="line-height: 1.6; color: #555;">
          Experienced Full Stack Developer with 5+ years of expertise in React, Node.js, and modern web technologies. 
          Passionate about creating user-friendly applications and solving complex problems. Proven track record of 
          delivering high-quality software solutions in fast-paced environments.
        </p>
      </section>

      <section style="margin-bottom: 30px;">
        <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Technical Skills</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
          <div>
            <h4 style="margin: 0 0 10px 0; color: #444;">Frontend</h4>
            <p style="margin: 0; color: #666;">React, JavaScript, TypeScript, HTML5, CSS3, Tailwind CSS</p>
          </div>
          <div>
            <h4 style="margin: 0 0 10px 0; color: #444;">Backend</h4>
            <p style="margin: 0; color: #666;">Node.js, Express.js, Python, RESTful APIs, GraphQL</p>
          </div>
          <div>
            <h4 style="margin: 0 0 10px 0; color: #444;">Database</h4>
            <p style="margin: 0; color: #666;">MongoDB, PostgreSQL, MySQL, Redis</p>
          </div>
          <div>
            <h4 style="margin: 0 0 10px 0; color: #444;">Tools & Others</h4>
            <p style="margin: 0; color: #666;">Git, Docker, AWS, Linux, Agile/Scrum</p>
          </div>
        </div>
      </section>

      <section style="margin-bottom: 30px;">
        <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Work Experience</h2>
        
        <div style="margin-bottom: 25px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <h3 style="margin: 0; color: #333;">Senior Full Stack Developer</h3>
            <span style="color: #666; font-weight: bold;">2022 - Present</span>
          </div>
          <p style="margin: 0 0 10px 0; color: #666; font-style: italic;">Tech Company Inc. - Remote</p>
          <ul style="color: #555; line-height: 1.6;">
            <li>Led development of React-based web applications serving 100K+ users</li>
            <li>Architected and implemented RESTful APIs using Node.js and Express</li>
            <li>Improved application performance by 40% through code optimization</li>
            <li>Mentored junior developers and conducted code reviews</li>
          </ul>
        </div>

        <div style="margin-bottom: 25px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <h3 style="margin: 0; color: #333;">Full Stack Developer</h3>
            <span style="color: #666; font-weight: bold;">2020 - 2022</span>
          </div>
          <p style="margin: 0 0 10px 0; color: #666; font-style: italic;">StartupXYZ - San Francisco, CA</p>
          <ul style="color: #555; line-height: 1.6;">
            <li>Developed and maintained multiple client-facing web applications</li>
            <li>Collaborated with design team to implement responsive UI/UX designs</li>
            <li>Integrated third-party APIs and payment processing systems</li>
            <li>Participated in agile development processes and sprint planning</li>
          </ul>
        </div>
      </section>

      <section style="margin-bottom: 30px;">
        <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Education</h2>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <h3 style="margin: 0; color: #333;">Bachelor of Science in Computer Science</h3>
          <span style="color: #666; font-weight: bold;">2016 - 2020</span>
        </div>
        <p style="margin: 0; color: #666; font-style: italic;">University of Technology</p>
      </section>

      <section>
        <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Projects</h2>
        
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 5px 0; color: #333;">Windows XP Forum System</h3>
          <p style="margin: 0 0 10px 0; color: #666; font-style: italic;">React, Node.js, MongoDB, Express.js</p>
          <p style="color: #555; line-height: 1.6;">
            Built a nostalgic Windows XP-themed forum with real-time features, user profiles, 
            file management, and authentic XP UI components. Includes karma system, notifications, 
            and responsive design.
          </p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 5px 0; color: #333;">E-Commerce Platform</h3>
          <p style="margin: 0 0 10px 0; color: #666; font-style: italic;">React, Node.js, PostgreSQL, Stripe API</p>
          <p style="color: #555; line-height: 1.6;">
            Developed a full-featured e-commerce platform with user authentication, 
            product catalog, shopping cart, and payment processing. Implemented admin 
            dashboard for inventory management.
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