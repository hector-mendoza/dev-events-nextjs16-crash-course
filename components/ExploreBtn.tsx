"use client";

import Image from "next/image";

const ExploreBtn = () => {
  return (
    <button typeof="button" id="explore-btn" className="mt-7 mx-auto">
      <a href="#events">
        Explore Events
        <Image
          src="/icons/arrow-down.svg"
          alt="Arrow down"
          width={24}
          height={24}
        />
      </a>
    </button>
  );
};

export default ExploreBtn;
