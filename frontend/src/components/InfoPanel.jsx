import React from 'react';

// Yeh component selected node ki details dikhayega
export function InfoPanel({ node }) {
  // Agar koi node selected nahi hai, toh kuch bhi render mat karo
  if (!node) {
    return null;
  }

  // CSS animation ke liye ek class add kar rahe hain
  return (
    <div className="info-panel active">
      <h2>{node.label}</h2>
      <p>{node.summary}</p>
    </div>
  );
}