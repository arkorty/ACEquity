import React from 'react';
import Image from 'next/image';
import { User } from '@/types/user';

const UserInfo: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="border shadow-md rounded-lg p-6 h-full">
      <div className="flex flex-col items-center mb-4">
        <Image src="/cat.jpg" alt="Profile" width={160} height={160} className="rounded-full mb-4 w-5/6" />
        <div className="text-center">
          <h2 className="text-2xl font-bold">{user.fullname}</h2>
          <p>@{user.username}</p> {/* Display username */}
          <p>{user.email}</p>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
