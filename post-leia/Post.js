import React from "react";
import Link from "next/link";
import slugify from "slugify";

const Post = ({
  slug,
  date,
  title,
  alt,
  description,
  image,
  number,
  category,
}) => {
  return (
    <div id={`item-${number}`} className={`post highlight-0${number}`}>
      <Link href={slug} passHref className="media" alt={alt} aria-label={alt}>
        <div
          className="media colorME"
          style={{
            backgroundImage: image.includes("http")
              ? `url(${image})`
              : `url(/posts/${image})`,
          }}
        ></div>
      </Link>
      <div className="main-post-inner caption">
        <Link
          href={slugify(category).toLowerCase()}
          alt={category}
          passHref
          className="post-category author"
        >
          {category}
        </Link>

        <Link href={slug} passHref className="post-link" alt={title}>
          {title.length >= 120 && (number === 4 || number === 5) ? (
            <>
              <h2 className="title title-desktop-only">{title}</h2>
              <h2 className="title title-mobile-only">
                {title.length >= 90 ? title.substring(0, 90) : title}...
              </h2>
            </>
          ) : (
            <h2 className="title">{title}</h2>
          )}
        </Link>
      </div>
    </div>
  );
};

export default Post;
