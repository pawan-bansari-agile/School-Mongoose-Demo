import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';

enum Role {
  Reader = 'Reader',
  Admin = 'Admin',
  School = 'School',
}

export default Role;

// eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const emailRegex: RegExp = /^\w+([\.+]*?\w+[\+]*)@\w+(\w+)(\.\w{2,3})+$/;

// eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const phoneRegex: RegExp =
  /^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/;

export enum folderTypes {
  SCHOOL_IMAGES = 'schoolImages',
}

export const ERR_MSGS = {
  USER_NOT_FOUND: 'User not found!',
  EMAIL_ALREADY_USED:
    'Entered email is not available to use! Please use another!',
  NOT_OWN_DETAILS: 'You can update own details only!',
  EMAIL_NOT_LINKED:
    'Provided email is not linked with any account! Please enter a valid email!',
  BAD_CREDS: 'Bad Credentials!',
  PWD_DONT_MATCH: "Password's don't match!",
  LINK_EXPIRED: 'Password reset token is invalid or has expired!',
  SESSION_EXPIRED: 'Session expired! Login again!',
  SCHOOL_NOT_FOUND: 'School not found!',
  STUDENT_NOT_FOUND: 'Student details not found!',
  NO_CHANGE_DETECTED: 'No change detected!',
};

export const SUCCESS_MSGS = {
  USER_DELETED: 'User Deleted!',
  SCHOOL_DELETED: 'School deleted!',
  STUDENT_DELETED: 'Student deleted!',
  STUDENT_CREATED: 'Student created!',
  USER_CREATED: 'User created!',
  SCHOOL_CREATED: 'School created!',
  LOGGED_IN: 'User logged in successfully!',
  SCHL_LOGGED_IN: 'School logged in successfully!',
  FIND_ALL_USERS: 'Found all users!',
  FIND_ALL_SCHOOLS: 'Found all schools!',
  FIND_ALL_STUDENTS: 'Found all students!',
  FOUND_ONE_USER: 'Found one user!',
  FOUND_ONE_SCHOOL: 'Found one school!',
  FOUND_ONE_STUDENT: 'Found one student!',
  UPDATED_USER: 'User updated successfully!',
  UPDATED_SCHOOL: 'School updated successfully!',
  MAIL_SENT: 'Please check your email for details to reset password!',
  PWD_CHANGED: 'Password changed successfully!',
  STATUS_CHANGED: 'Status changed!',
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

export const StudentStorage = {
  storage: diskStorage({
    destination: './upload/studentImages',
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

export const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  { flags: 'a' },
);
