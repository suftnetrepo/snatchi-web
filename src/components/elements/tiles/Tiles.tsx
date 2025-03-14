import { FC } from 'react';

const Tiles: FC = () => {
  return (
    <div className="row gx-md-5 gy-5">
      <div className="col-md-4 offset-md-2 align-self-end">
        <figure className="rounded">
          <img src="/img/hero/h4.png" srcSet="/img/photos/g1@2x.jpg 2x" alt="" />
        </figure>
      </div>

      <div className="col-md-6 align-self-end">
        <figure className="rounded">
          <img src="/img/hero/h1.jpg" srcSet="/img/photos/g2@2x.jpg 2x" alt="" />
        </figure>
      </div>

      <div className="col-md-6 offset-md-1">
        <figure className="rounded">
          <img src="/img/hero/h2.jpg" srcSet="/img/photos/g3@2x.jpg 2x" alt="" />
        </figure>
      </div>

      <div className="col-md-4 align-self-start">
        <figure className="rounded">
          <img src="/img/hero/h3.jpg" srcSet="/img/photos/g3@2x.jpg 2x" alt="" />
        </figure>
      </div>
    </div>
  );
};

export default Tiles;
