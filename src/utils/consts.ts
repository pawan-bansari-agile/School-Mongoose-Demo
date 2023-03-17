import { diskStorage } from 'multer';

enum Role {
  Reader = 'Reader',
  Admin = 'Admin',
  School = 'School',
}

export default Role;

// eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const emailRegex: RegExp = /^\w+([\.+]*?\w+[\+]*)@\w+(\w+)(\.\w{2,3})+$/;

export const ERR_MSGS = {
  BLOG_NOT_FOUND: 'Post Not Found!',
  USER_NOT_FOUND: 'User not found!',
  EMAIL_ALREADY_USED:
    'Entered email is not available to use! Please use another!',
  COMMENT_NOT_FOUND: 'Comment not found!',
  NOT_OWN_DETAILS: 'You can update own details only!',
  NOT_YOUR_BLOG: "Cannot update other's blog!",
  CANT_DELETE_POST: "Cannot delete other's blog!",
  NOT_YOUR_COMMENT: "Cannot update other's comment!",
  CANT_DELETE_COMMENT: "Cannot delete other's comment!",
  ADMIN_FIRST: 'First User Must be an Admin!',
  EMAIL_NOT_LINKED:
    'Provided email is not linked with any account! Please enter a valid email!',
  BAD_CREDS: 'Bad Credentials!',
  PWD_DONT_MATCH: "Password's don't match!",
  LINK_EXPIRED: 'Password reset token is invalid or has expired!',
  SESSION_EXPIRED: 'Session expired! Login again!',
  SCHOOL_NOT_FOUND: 'School not found!',
};

export const SUCCESS_MSGS = {
  USER_DELETED: 'User Deleted!',
  POST_DELETED: 'Post Deleted!',
  COMMENT_DELETED: 'Comment Deleted!',
  BLOG_CREATED: 'Blog created!',
  FIND_ALL_BLOGS: 'Found all blogs!',
  FOUND_ONE_POST: 'Found one post!',
  UPDATED_POST: 'Post updated successfully!',
  COMMENT_CREATED: 'Commented successfully!',
  FIND_ALL_COMMENTS: 'Found all comments!',
  FOUND_ONE_COMMENT: 'Found one comment!',
  UPDATED_COMMENT: 'Comment updated successfully!',
  USER_CREATED: 'User created!',
  LOGGED_IN: 'User logged in successfully!',
  FIND_ALL_USERS: 'Found all users!',
  FIND_ALL_SCHOOLS: 'Found all schools!',
  FOUND_ONE_USER: 'Found one user!',
  FOUND_ONE_SCHOOL: 'Found one school!',
  UPDATED_USER: 'User updated successfully!',
  UPDATED_SCHOOL: 'School updated successfully!',
  MAIL_SENT: 'Please check your email for details to reset password!',
  PWD_CHANGED: 'Password changed successfully!',
};

export const SchoolStorage = {
  storage: diskStorage({
    destination: './upload/schoolImages',
    filename: (req, file, cb) => {
      const filename: string = file.originalname;
      const fileName: string = filename.replace(/\s/g, '');
      const extention: string[] = fileName.split('.');
      cb(null, `${extention[0]}${new Date().getTime()}.${extention[1]}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(null, false);
    }
    cb(null, true);
  },
};
