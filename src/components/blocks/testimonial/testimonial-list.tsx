import { FC, HTMLAttributes } from 'react';

// =================================================
type TestimonialCardListProps = {
    name: string;
    review: string;
    designation: string;
    blockClassName?: HTMLAttributes<HTMLQuoteElement>['className'];
    blockDetailsClassName?: HTMLAttributes<HTMLDivElement>['className'];
};
// =================================================

const TestimonialCardList: FC<TestimonialCardListProps> = ({
    name,
    review,
    designation,
    blockClassName = 'icon icon-top fs-lg text-center',  // Default value
    blockDetailsClassName = 'blockquote-details justify-content-center text-center'  // Default value
}) => {

    return (
        <blockquote className={blockClassName}>
            <p>“{review}”</p>

            <div className={blockDetailsClassName}>
                <div className="info ps-0">
                    <h5 className="mb-1">{name}</h5>
                    <p className="mb-0">{designation}</p>
                </div>
            </div>
        </blockquote>
    );
};

export default TestimonialCardList;
