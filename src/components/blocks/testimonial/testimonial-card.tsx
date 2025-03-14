import { FC } from 'react';
import { testimonialList2 } from 'data/testimonial-list';
import TestimonialCardList from './testimonial-list';
import Carousel from 'components/reuseable/Carousel';

// ============================================================
type TestimonialCard4Props = { className?: string; sliderWrapperClassname?: string };
// ============================================================

const TestimonialCard: FC<TestimonialCard4Props> = ({
    className = '',
    sliderWrapperClassname = 'p-10 p-md-11 p-lg-13'
}) => {
    return (
        <div className={`card shadow-lg ${className}`}>
            <div className="row gx-0">
                <div
                    style={{ backgroundImage: 'url(/img/photos/tm1.jpg)' }}
                    className="col-lg-6 image-wrapper bg-image bg-cover rounded-top rounded-lg-start"
                />

                <div className="col-lg-6">
                    <div className={sliderWrapperClassname}>
                        <Carousel grabCursor slidesPerView={1} navigation={false} className="dots-closer">
                            {testimonialList2.map((item, i) => (
                                <TestimonialCardList key={i} {...item} />
                            ))}
                        </Carousel>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestimonialCard;
