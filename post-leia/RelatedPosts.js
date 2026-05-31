import React from "react";

const RelatedPosts = ({ slug, image, category, title, categorySlug }) => (
  <div id={`item-2`} className={`post column-post`}>
    <a href={"/" + slug} className="media">
      <div
        className="media"
        style={{
          backgroundImage: image?.includes("http")
            ? `url(${image})`
            : `url(/posts/${image})`,
        }}
      ></div>
    </a>
    <div className="main-post-inner caption">
      <a
        href={"/" + categorySlug}
        alt={category}
        className="post-category author"
      >
        {category}
      </a>
      <a href={"/" + slug} className="post-link">
        <h2 className="title">{title}</h2>
      </a>
    </div>
  </div>
);

export default RelatedPosts;
