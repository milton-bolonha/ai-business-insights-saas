import React from "react";

const TOC = ({ tocs, gtag, display, toggle, handleToggle }) => {
  return (
    <>
      {Array.from(tocs).map((toc, indt) => (
        <li key={indt}>
          <a href={`#${toc.id}`} onClick={() => handleToggle()}>
            {toc.innerText}
          </a>
        </li>
      ))}
    </>
  );
};
export default TOC;
