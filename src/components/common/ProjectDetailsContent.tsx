import { FC } from 'react';

// =======================================================
type ProjectDetailsContentProps = {
  title: string;
  titleClass?: string;
  contentRowClass?: string;
};
// =======================================================

const ProjectDetailsContent: FC<ProjectDetailsContentProps> = ({
  title,
  contentRowClass = 'row gx-0',
  titleClass = 'display-6 mb-4'
}) => {
  return (
    <div className="row">
      <div className="col-lg-10 offset-lg-1">
        <h2 className={titleClass}>{title}</h2>

        <div className={contentRowClass}>
          <div className="col-md-9 text-justify">
            <p>
              Our charity, the Tech First Foundation, is launching its first project in Nigeria, specifically in the Ilupeju region of Ekiti state. Ansa-Ud Deen Nursery and Primary School, founded in 1951, serves as one of the few schools in Ilupeju. Currently, the school has 105 students, with 95 in primary education, and is staffed by 15 teachers.
            </p>
            <p>
              However, Ansa-Ud Deen faces significant challenges. Notably, there is no school library, and some classrooms are in poor condition after over sixty years of operation.
            </p>
            <p>
              To tackle these challenges, our mission is clear: to providing laptops and other digital tools and introduce digital education to upper primary classes (grades 4 to 6), developping their digital litteracy and the foundational skills required to pursue a career in IT or any field requiring the use of technology. To set up and manage complimentary regular online sessions in Self-development to foster the resilient and resourceful Mindset within them while nurturing their unique talents. Laptops would also be provided to teachers alongside tailored online courses for the purpose of information research and improvement of their educational practices, and potentially community lifestyle.
            </p>
            <p>
              We plan to renovate a dilapidated classroom into a modern computer lab, thereby creating the space inwhich the students’ & teachers’ virtual learning may take place. To ensure uninterrupted access to power, we'll invest in solar panels and other essential equipment. Our local partners will play a crucial role in providing transportation, setting up computer lab, and ensuring maintenance for optimal utilization.
            </p>
            <p>
              Through this effort, we aim to empower students, equipping them with the knowledge and tools they need to succeed in a digital world.
              We seek to raise £25,000 and collect 55 functioning laptops to support this project.
            </p>
          </div>

          <div className="col-md-2 ms-auto">
            <ul className="list-unstyled">
              <li>
                <h5 className="mb-1">Start Date</h5>
                <p>17 April 2024</p>
              </li>

              <li>
                <h5 className="mb-1">Ansa-Ud Deen Nursery</h5>
                <p>Ilupeju region of Ekiti state</p>
              </li>
            </ul>      
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsContent;
