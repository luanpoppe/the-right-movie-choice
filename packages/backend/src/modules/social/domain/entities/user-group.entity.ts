export type UserGroupEntity = {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  createdAt: Date;
  updatedAt: Date;
};

export type UserGroupListItemEntity = {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  memberCount: number;
  joinedAt: Date;
};
