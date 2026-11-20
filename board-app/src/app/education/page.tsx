import { GLOSSARY, LESSONS } from "@/lib/education";

export const metadata = {
  title: "Education",
};

export default function EducationPage() {
  return (
    <div className="container">
      <div className="page-head">
        <h1>Education & encyclopedia</h1>
        <p>
          Sample lessons and glossary entries from the ClearPath learning path. Full encyclopedia
          lives on clearpathtrader.com.
        </p>
      </div>

      <section className="lesson-grid" style={{ paddingBottom: "1rem" }}>
        {LESSONS.map((lesson) => (
          <article key={lesson.id} className="lesson">
            <div className="meta-row">
              <span>{lesson.level}</span>
              <span>{lesson.minutes} min</span>
            </div>
            <h3>{lesson.title}</h3>
            <p style={{ color: "var(--text-muted)", marginTop: 0 }}>{lesson.summary}</p>
            {lesson.body.map((para) => (
              <p key={para.slice(0, 24)} style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                {para}
              </p>
            ))}
          </article>
        ))}
      </section>

      <section style={{ paddingBottom: "2.5rem" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem" }}>Glossary teaser</h2>
        <dl className="glossary">
          {GLOSSARY.map((entry) => (
            <div key={entry.term}>
              <dt>{entry.term}</dt>
              <dd>{entry.definition}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
