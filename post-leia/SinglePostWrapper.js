import React from "react";

import integrations from "@/content/settings/integrations.json";
import theme from "@/content/settings/theme.json";

import PostLeftColumn from "./PostLeftColumn";
import PostRightColumn from "./PostRightColumn";
import PostMainColumn from "./PostMainColumn";
import PostFooter from "./PostFooter";

const adClient =
  integrations?.googleIntegration?.adsClientID === null ||
  integrations?.googleIntegration?.adsClientID === "" ||
  integrations?.googleIntegration?.adsClientID === "ca-pub-"
    ? false
    : true;

const SinglePostWrapper = ({
  highlightImage,
  date,
  author,
  category,
  title,
  slug,
  promoVisitState,
  setReadMore,
  readMore,
  topic,
  excerpt,
  promoNOread,
  postHeadings,
  handleToggle,
  toggle,
  timeToRead,
  replacedHtml,
  relatedPosts,
  city,
  state,
  killSEO,
  injectionJSref,
}) => {
  return (
    <article>
      <div ref={injectionJSref}></div>
      <section>
        <div className={`main-post ${promoNOread ? "promoVisit" : ""}`}>
          {theme?.postsSettings?.leftColumn ? (
            <PostLeftColumn
              promoNOread={promoNOread}
              author={author}
              postHeadings={postHeadings}
              handleToggle={handleToggle}
              date={date}
              timeToRead={timeToRead}
            />
          ) : null}

          <PostMainColumn
            title={title}
            category={category}
            topic={topic}
            excerpt={excerpt}
            promoNOread={promoNOread}
            author={author}
            date={date}
            timeToRead={timeToRead}
            postHeadings={postHeadings}
            toggle={toggle}
            handleToggle={handleToggle}
            highlightImage={highlightImage}
            replacedHtml={replacedHtml}
            setReadMore={setReadMore}
          />
          {theme?.postsSettings?.rightColumn ||
          adClient ||
          relatedPosts?.length >= 1 ? (
            <PostRightColumn
              relatedPosts={relatedPosts}
              promoVisitState={promoVisitState}
              readMore={readMore}
              promoNOread={promoNOread}
              killSEO={killSEO}
              adClient={adClient}
              client={integrations?.googleIntegration?.adsClientID}
              city={city}
              state={state}
              mainPostSlug={slug}
            />
          ) : null}
        </div>
        {theme?.postsSettings?.bottomRow ? (
          <PostFooter
            promoNOread={promoNOread}
            killSEO={killSEO}
            adClient={adClient}
            client={integrations?.googleIntegration?.adsClientID}
            relatedPosts={relatedPosts}
            mainPostSlug={slug}
            city={city}
            state={state}
          />
        ) : null}
      </section>
    </article>
  );
};

export default SinglePostWrapper;
