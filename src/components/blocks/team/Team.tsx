import { FC } from 'react';
// -------- custom component -------- //
import Carousel from 'components/reuseable/Carousel';
import carouselBreakpoints from 'utils/carouselBreakpoints';
import TeamCard  from 'components/blocks/team/TeamCard';
// -------- data -------- //
import teams from 'data/team-list';

const Team: FC = () => {
  return (
    <section className="wrapper bg-light">
      <div className="container  mb-10" style={{ maxWidth: "80%" }}>
        <div className="row gx-lg-8 gx-xl-12 gy-10 align-items-center">
          <div className="col-lg-4">
            <h2 className="fs-15 text-uppercase text-line text-primary text-center mb-3">Meet the Team</h2>
            <h3 className="display-6 mb-5">At TFF, we believe in the power of unity and the impact of shared goals.</h3>
            <p>
              We are more than just a team; we are a family. A family that celebrates diversity, values collaboration, and believes deeply in our cause.
            </p>           
          </div>

          <div className="col-lg-8">
            <Carousel grabCursor navigation={false} breakpoints={carouselBreakpoints}>
              {teams.map((team) => (
                <TeamCard key={team.id} {...team} />
              ))}
            </Carousel>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Team;
