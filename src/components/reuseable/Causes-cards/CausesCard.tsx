import { FC } from 'react';
import Link from 'next/link';
import NextLink from '../links/NextLink';
import FigureImage from 'components/reuseable/FigureImage';
import ProgressBar from 'components/common/ProgressBar';

// ========================================================
type CausesCardProps = {
  link: string;
  title: string;
  image: string;
  category: string;
  description: string;
};
// ========================================================

const CausesCard: FC<CausesCardProps> = (props) => {
  const { title, description, link, image } = props;

  const fundsRaised = 24808;
  const fundraisingGoal = 26000;

  return (
    <article className="item post col-md-4">
      <div className="card">
        <figure className="card-img-top overlay overlay-1 hover-scale">
          <Link href="#">
            <a>
              <FigureImage width={560} height={350} src={image} />
              <span className="bg" />
            </a>
          </Link>

          <figcaption>
            <h5 className="from-top mb-0">Read More</h5>
          </figcaption>
        </figure>

        <div className="card-body">
          <div className="post-header">
           
            <h1 className="mt-1 mb-3 fs-30">
              <NextLink title={title} className="link-dark" href={link} />
            </h1>
          </div>

          <div className="post-content">
            <p>{description}</p>
          </div>
          <div className="wrapper bg-gray rounded p-4">
            <div className="post-content">
              <ProgressBar value={fundsRaised} max={fundraisingGoal} />
            </div>
          </div>         

        </div>      
      </div>
    </article>
  );
};

export default CausesCard;
