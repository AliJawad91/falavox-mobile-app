import { User } from "../types";

export const dummyUsers: User[] = [
  {
    _id: "1",
    userName: "john_doe",
    email: "john.doe@example.com",
    firstName: "John",
    lastName: "Doe",
    phoneNumber: "+1234567890",
    role: "user",
    status: "active",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-20T14:22:00Z"
  },
  {
    _id: "2",
    userName: "sarah_smith",
    email: "sarah.smith@example.com",
    firstName: "Sarah",
    lastName: "Smith",
    phoneNumber: "+1234567891",
    role: "admin",
    status: "active",
    createdAt: "2024-01-10T09:15:00Z",
    updatedAt: "2024-01-18T11:45:00Z"
  },
  {
    _id: "3",
    userName: "mike_johnson",
    email: "mike.johnson@example.com",
    firstName: "Mike",
    lastName: "Johnson",
    phoneNumber: "+1234567892",
    role: "user",
    status: "inactive",
    createdAt: "2024-01-05T16:40:00Z",
    updatedAt: "2024-01-19T13:20:00Z"
  },
  {
    _id: "4",
    userName: "emily_wilson",
    email: "emily.wilson@example.com",
    firstName: "Emily",
    lastName: "Wilson",
    phoneNumber: "+1234567893",
    role: "moderator",
    status: "active",
    createdAt: "2024-01-12T08:20:00Z",
    updatedAt: "2024-01-21T10:10:00Z"
  },
  {
    _id: "5",
    userName: "alex_brown",
    email: "alex.brown@example.com",
    firstName: "Alex",
    lastName: "Brown",
    phoneNumber: "+1234567894",
    role: "user",
    status: "pending",
    createdAt: "2024-01-22T14:55:00Z",
    updatedAt: "2024-01-22T14:55:00Z"
  }
];