import React from 'react';
import { Card, Form, InputGroup, ListGroup, Row, Col, Image } from 'react-bootstrap';
import { FaRegSmile, FaPaperPlane } from 'react-icons/fa';
import { useTaskComments } from '@/hooks/useTaskComments';
import { useSession } from 'next-auth/react';
import { formatRelativeTime } from '@/utils/helpers';

export default function RenderTaskComment({ projectId, taskId }) {
  const { data: session } = useSession();
  const { fields, comments, handleAddComment, handleReset, handleChange } = useTaskComments(
    projectId,
    taskId
  );

  const handleSubmitComment = async () => {
    const body = {
      user: {
        first_name: session.user.first_name,
        last_name: session.user.last_name
      },
      text: fields.text,
      author: session.user.id,
      taskId: taskId,
      projectId: projectId
    };

    await handleAddComment(body).then(() => {
      handleReset();
    });
  };

  return (
    <Card className="shadow-sm">
      <Card.Body className="p-0">
        <ListGroup variant="flush">
          {comments.map((comment) => (
            <ListGroup.Item key={comment._id}>
              <Row>
                <Col className="ps-0">
                  <div className="d-flex justify-content-between">
                    <div className="d-flex justify-content-start align-items-center">
                      <Image
                        src={`/img/faces/9.jpg`}
                        roundedCircle
                        width={40}
                        height={40}
                        className="border border-white ms-n2"
                        alt="User avatar"
                      />
                      <strong className="text-secondary ms-1">
                        {comment.author.first_name} {comment.author.last_name}
                      </strong>
                    </div>
                    <small className="text-muted">{formatRelativeTime(comment.createdAt)}</small>
                  </div>
                  <div className="mt-1">{comment.text}</div>
                </Col>
              </Row>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card.Body>
      <Card.Footer className="bg-white">
        <InputGroup>
          <InputGroup.Text>
            <FaRegSmile />
          </InputGroup.Text>
          <Form.Control
            placeholder="Write a comment..."
            onChange={(e) => handleChange('text', e.target.value)}
            value={fields.text}
          />
          <InputGroup.Text style={{ cursor: 'pointer' }}>
            <FaPaperPlane onClick={() => fields.text.length > 0 && handleSubmitComment()} />
          </InputGroup.Text>
        </InputGroup>
      </Card.Footer>
    </Card>
  );
}
