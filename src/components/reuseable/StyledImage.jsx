import React, { useState } from 'react';
import { Container, Row, Col, Image } from 'react-bootstrap';

const fallbackImage = '/img/blank.png'; 

function StyledImage({
  url,
  height,
  width,
  rounded = false,
  roundedCircle = false,
  thumbnail = false,
  alt = 'Image',
  ...rest
}) {
  const [imgSrc, setImgSrc] = useState(url || fallbackImage);

  const handleError = () => {
    if (imgSrc !== fallbackImage) {
      setImgSrc(fallbackImage);
    }
  };

  return (
    <Container>
      <Row>
        <Col xs={12} md={12}>
          <Image
            src={imgSrc}
            alt={alt}
            onError={handleError}
            height={height}
            width={width}
            rounded={rounded}
            roundedCircle={roundedCircle}
            thumbnail={thumbnail}
            {...rest}
          />
        </Col>
      </Row>
    </Container>
  );
}

export default StyledImage;
