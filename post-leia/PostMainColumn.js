import React from "react";
import Link from "next/link";
import Image from "next/image";
import slugify from "slugify";

import theme from "@/content/settings/theme.json";
import logos from "@/content/settings/logos.json";

import TOCContainer from "@/containers/TOCContainer";

const PostMainColumn = ({
  category,
  topic,
  excerpt,
  author,
  date,
  timeToRead,
  postHeadings,
  toggle,
  handleToggle,
  killSEO,
  highlightImage,
  replacedHtml,
  promoNOread,
  title,
  setReadMore,
}) => {
  const fullDate = new Date(date);
  const [month, day, year] = [
    fullDate.getMonth(),
    fullDate.getDate(),
    fullDate.getFullYear(),
  ];
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return (
    <div className="container">
      {promoNOread ? null : (
        <nav className="breadcrumb">
          <Link href="/" className="mark">
            <Image
              src={logos.markLogo || `/brandimages/logomark.png`}
              alt={"logomark"}
              width={20}
              height={20}
            />
          </Link>
          <ul>
            <li>
              <span className="search-hold">{`❯`}</span>
              <Link
                href={
                  "/" +
                  slugify(category || category[0] || "general").toLowerCase()
                }
              >
                {category || "general"}
              </Link>
            </li>
            <li>
              <span className="search-hold">{`❯`}</span>
              <p>{topic?.split(",")[0] || "general"}</p>
            </li>
          </ul>
        </nav>
      )}
      <h1>{title}</h1>

      {promoNOread ? (
        <>
          <p
            className="excerpt"
            dangerouslySetInnerHTML={{ __html: excerpt }}
          />
        </>
      ) : null}
      {!killSEO ? <div id="rampjs_slot1"></div> : null}

      {!promoNOread ? (
        <>
          <div className="post-author post-author-infos mobile-only">
            <p>
              <strong>By {author}</strong>
            </p>
            <hr className="small-row mb0" />
            <p>
              <em>
                Published on{" "}
                <time className="post-author-date date" dateTime={date}>
                  {`${monthNames[month]} ${day}, ${year}`}
                </time>
                .
              </em>
            </p>
            <p className="post-author-date read-time">
              🕒 {timeToRead} minute read
            </p>
          </div>
          {theme?.postsSettings?.leftColumn ? (
            <TOCContainer
              tocs={postHeadings || null}
              // gtag={gtag}
              display={"mobile"}
              toggle={toggle}
              handleToggle={handleToggle}
            />
          ) : null}

          <Image
            src={
              highlightImage.includes("http")
                ? highlightImage
                : `/posts/${highlightImage}`
            }
            alt={title}
            critical="true"
            className={"post-highlight-img"}
            width={560}
            height={300}
          />
          <div
            className="post-article-content"
            dangerouslySetInnerHTML={{ __html: replacedHtml }}
          ></div>
        </>
      ) : null}
      {promoNOread ? (
        <a href="#" className="read-more" onClick={() => setReadMore(true)}>
          Read More
        </a>
      ) : null}
    </div>
  );
};

export default PostMainColumn;
