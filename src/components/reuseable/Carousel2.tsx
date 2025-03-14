import { FC, Fragment, useState } from 'react';
import Swiper, { FreeMode, Navigation, Thumbs } from 'swiper';
import { Swiper as SwiperCarousel, SwiperSlide } from 'swiper/react';

const Carousel2: FC = () => {
  const [thumbsSwiper, setThumbsSwiper] = useState<Swiper>();
  const [prevEl, setPrevEl] = useState<HTMLElement | null>(null);
  const [nextEl, setNextEl] = useState<HTMLElement | null>(null);

  const slideImages = [
    { id: 1, url: '/img/hero/h1.jpg', title: "Be a Hero, Make a Difference", description: "Transform lives with your generosity. Every contribution creates impactful change" },
    { id: 2, url: '/img/hero/h2.jpg', title: "Every Child Deserves a Future", description: "Help children thrive with your donation. Support their education and healthcare" },
    { id: 3, url: '/img/hero/h3.jpg', title: "Empowering Communities, Building Hope", description: "Provide resources to uplift communities. Your involvement brings sustainable hope" },
    { id: 4, url: '/img/hero/h5.jpg', title: "Join the Fight Against Hunger", description: "Combat hunger with your support. Donate to feed families and end food insecurity" }
  ];

  return (
    <Fragment>
      <div className="swiper-main">
        <SwiperCarousel
          spaceBetween={10}
          pagination={false}
          navigation={{ prevEl, nextEl }}
          modules={[FreeMode, Navigation, Thumbs]}
        // thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
        >
          {slideImages.map(({ url, id, title, description }) => (
            <SwiperSlide
              key={id}
              style={{ backgroundImage: `url(${url})` }}
              className="bg-overlay bg-overlay-900 bg-dark bg-image"
            >
              <div className="swiper-static">
                <div className="container h-100 d-flex align-items-center justify-content-start">
                  <div className="row">
                    <div className="col-lg-10 mx-auto mt-n10 text-start">
                      <h1 className="fs-19 text-uppercase ls-xl text-white mb-3 animate__animated animate__zoomIn animate__delay-1s">
                        {title}
                      </h1>
                      <h2 className="display-1 fs-50 text-white mb-8 animate__animated animate__zoomIn animate__delay-1s">
                        {description}
                      </h2>
                      <div className='animate__animated animate__zoomIn animate__delay-1s'>
                        <a
                          href="https://1.envato.market/Ea4VxK"
                          className="btn btn-yellow  rounded-pill me-2 "
                          target="_blank"
                          rel="noreferrer"
                        >
                          Discover More
                        </a>
                        <a
                          href="https://1.envato.market/Ea4VxK"
                          className="btn btn-leaf rounded-pill "
                          target="_blank"
                          rel="noreferrer"
                        >
                          Join our team
                        </a>
                      </div>

                    </div>
                  </div>
                  <div className="row">
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}

          <div className="swiper-navigation">
            <div
              role="button"
              ref={(node) => setPrevEl(node)}
              className="swiper-button swiper-button-prev swiper-button-disabled"
            />
            <div role="button" ref={(node) => setNextEl(node)} className="swiper-button swiper-button-next" />
          </div>
        </SwiperCarousel>
      </div>

      {/* <SwiperCarousel
        freeMode
        threshold={2}
        spaceBetween={10}
        slidesPerView={5}
        watchSlidesProgress
        onSwiper={setThumbsSwiper}
        modules={[FreeMode, Navigation, Thumbs]}
      >
        {thumbImages.map(({ url, id }) => (
          <SwiperSlide key={id}>
            <img src={url} alt="product" />
          </SwiperSlide>
        ))}
      </SwiperCarousel> */}
    </Fragment>
  );
};

export default Carousel2;
