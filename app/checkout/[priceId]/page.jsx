import StripeWrapper from './StripeWrapper';
import CheckOut from './Checkout'; // move your big component into separate file

export default function Page() {
  return (
    <StripeWrapper>
      <CheckOut captchaSiteKey={process.env.SITE_KEY || ''} />
    </StripeWrapper>
  );
}