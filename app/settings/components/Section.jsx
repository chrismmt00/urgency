"use client";

import styles from "../page.module.css";

export default function Section({ title, description, children }) {
  return (
    <section className={styles.section}>
      {title && <h3>{title}</h3>}
      {description && <p>{description}</p>}
      {children}
    </section>
  );
}
