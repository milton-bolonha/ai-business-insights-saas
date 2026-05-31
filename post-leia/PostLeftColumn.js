import React from "react";
import TOCContainer from "@/containers/TOCContainer";
import Image from "next/image";

const PostLeftColumn = ({
  promoNOread,
  author,
  postHeadings,
  handleToggle,
  date,
  timeToRead,
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
    <div className={`left-column ${promoNOread ? "none" : ""}`}>
      <div className="post-author post-author-infos desktop-only">
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />

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
          <Image
            src={`/brandimages/clock.png`}
            alt={"logomark"}
            width={15}
            height={15}
          />{" "}
          {timeToRead} minute read
        </p>
      </div>
      <TOCContainer
        author={author}
        tocs={postHeadings}
        // gtag={gtag}
        display={"desktop"}
        toggle={true}
        handleToggle={handleToggle}
        date={date}
        timeToRead={timeToRead}
      />
    </div>
  );
};

export default PostLeftColumn;
