import React, {useState, useEffect} from 'react';
import { VERBS } from '../config';
import { taskCommentValidator } from '@/protected/integrator/rules';
import { TASK_COMMENTS } from '@/utils/apiUrl';
import { zat } from '@/utils/api';

const useTaskComments = (projectId, taskId) => {
  const [state, setState] = useState({
    comments: [],
    loading: false,
    error: null,
    success: false,
    fields: taskCommentValidator.fields,
    rules: taskCommentValidator.rules,
  });

  const handleChange = (name, value) => {
    setState(prevState => ({
      ...prevState,
      fields: {
        ...prevState.fields,
        [name]: value,
      },
    }));
  };

  const handleError = error => {
    setState(pre => {
      return {
        ...pre,
        error: error,
        fields: taskCommentValidator.fields,
        loading: false,
      };
    });
  };

  const handleReset = () => {
    setState(pre => {
      return {
        ...pre,
        success: false,
        fields: {text: ''},
        loading: false,
        error: null,
      };
    });
  };

  async function handleFetchComments() {
    const {success, data, errorMessage} = await zat(
      TASK_COMMENTS.fetch,
      null,
      VERBS.GET,
      {
        projectId,
        taskId,
      },
    );

    if (success) {
      setState(prevState => ({
        ...prevState,
        comments: data?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        loading: false,
      }));
    } else {
      handleError(errorMessage || 'Failed to fetch the task.');
    }
  }

  const handleAddComment = async body => {
    const {success, data, errorMessage} = await zat(
      TASK_COMMENTS.addOne,
      body,
      VERBS.POST,
    );

    const newComment = {
      createdAt : data.createdAt,
      _id :data._id,
      text : body.text,
      author : {
        _id :body.author,
        first_name: body.user.first_name,
        last_name: body.user.last_name,
        secure_url: body.user.secure_url,
      }
    }

    if (success) {
      setState(prevState => ({
        ...prevState,
        comments: [newComment, ...prevState.comments],
        success: true,
        loading: false,
      }));

      return true;
    } else {
      handleError(errorMessage);
    }
  };

  const handleDelete = async comment_id => {
    const {success, errorMessage} = await zat(
      TASK_COMMENTS.removeOne,
      null,
      VERBS.DELETE,
      {
        id: comment_id,
        taskId: taskId,
        projectId: projectId,
      },
    );

    if (success) {
      setState(pre => ({
        ...pre,
        comments: pre.comments.filter(comment => comment._id !== comment_id),
        loading: false,
      }));
      return true;
    } else {
      handleError(errorMessage || 'Failed to delete the user.');
      return false;
    }
  };

  useEffect(() => {
    taskId && projectId && handleFetchComments(taskId, projectId);
  }, [taskId, projectId]);

  return {
    ...state,
    handleDelete,
    handleReset,
    handleAddComment,
    handleChange,
  };
};

export {useTaskComments};
