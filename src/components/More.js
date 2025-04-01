import React from "react";

const More = () => {
  return (
    <div className="more-history-container">
      <header className="more-history-header">
        <h1>History of College Football</h1>
        <p>
          Explore the rich and fascinating history of college football in America.
          From its humble beginnings to the modern powerhouse sport it is today,
          delve into the stories, milestones, and legends that have shaped the game.
        </p>
      </header>

      <main className="more-history-content">
        <section>
          <h2>The Early Years</h2>
          <p>
            College football emerged in the late 19th century, with the first intercollegiate game
            played in 1869 between Princeton and Rutgers. In these formative years, rules were
            experimental and the sport was a rugged affair.
          </p>
        </section>

        <section>
          <h2>Growth and Expansion</h2>
          <p>
            The early 20th century saw rapid growth of the sport, with universities across the nation
            embracing football as a symbol of school pride. Protective equipment evolved as did the rules,
            making the game safer and more competitive.
          </p>
        </section>

        <section>
          <h2>The Modern Era</h2>
          <p>
            In the latter half of the 20th century and beyond, college football became a major spectacle,
            blending tradition with modern athleticism. Conferences realigned, bowl games captured national
            attention, and the sport influenced social and cultural movements across America.
          </p>
        </section>

        <section>
          <h2>Looking Ahead</h2>
          <p>
            As college football continues to evolve, new challenges and innovations are propelling the game
            into the future. The legacy of its past serves as the foundation for a dynamic and ever-changing
            athletic landscape.
          </p>
        </section>
      </main>

      <style jsx="true">{`
        .more-history-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
        }
        .more-history-header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eaeaea;
        }
        .more-history-header h1 {
          font-size: 2.5rem;
          margin-bottom: 10px;
          color: #333;
        }
        .more-history-header p {
          font-size: 1.2rem;
          color: #666;
        }
        .more-history-content section {
          margin-bottom: 30px;
        }
        .more-history-content h2 {
          font-size: 1.8rem;
          margin-bottom: 10px;
          color: #0066cc;
        }
        .more-history-content p {
          font-size: 1rem;
          line-height: 1.6;
          color: #444;
        }
      `}</style>
    </div>
  );
};

export default More;