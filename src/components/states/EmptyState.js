import React from "react";

function EmptyState() {
  return (
    <div className="state state--empty">
      <h2>No services found</h2>
      <p>
        Try clearing some filters or searching a different area or category.
      </p>
    </div>
  );
}

export default EmptyState;