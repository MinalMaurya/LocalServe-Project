import React from "react";

function Loading() {
  return (
    <div className="state state--loading" role="status">
      <div className="spinner" />
      <p>Finding the best local services for you…</p>
    </div>
  );
}
export default Loading;