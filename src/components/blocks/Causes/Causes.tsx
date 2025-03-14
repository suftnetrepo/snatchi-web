import { FC } from 'react';
import { CausesCard } from 'components/reuseable/Causes-cards';
import { blogList4 } from 'data/blog';

type prop = {
  limit : number
}

const Causes: FC<prop> = ({ limit = 0 }) => {
  return (
    <div className="row">
      <div className='d-flex align-items-center justify-content-center'>
        <div className="col-lg-10">

          <div className="blog grid grid-view">
            <div className="row isotope gx-md-8 gy-8 mb-8">
              {blogList4.slice(0, limit).map((item) => (
                <CausesCard {...item} key={item.id} />
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Causes;
