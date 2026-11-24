import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SessionStatus } from 'src/enums';
import { UserAuthSession } from 'src/schemas/user-auth-session.schema';
import { generateId } from 'src/utils';

// Fields a caller may set on a session; identity fields stay out of reach.
export type UserAuthSessionPatch = Partial<
  Omit<UserAuthSession, 'id' | 'userId' | 'createdAt' | 'createdBy'>
>;

@Injectable()
export class UserAuthSessionRepository {
  constructor(
    @InjectModel(UserAuthSession.name)
    private readonly sessionModel: Model<UserAuthSession>,
  ) {}

  //get the session of a user (there is one per user)
  async getByUserId(userId: string): Promise<UserAuthSession | null> {
    return await this.sessionModel.findOne({ userId }).lean();
  }

  //create the user's session, or update it in place if one exists. Creating
  //sets the generated id / createdAt; both are left alone on later updates.
  async upsert(
    userId: string,
    patch: UserAuthSessionPatch,
  ): Promise<UserAuthSession> {
    return await this.sessionModel
      .findOneAndUpdate(
        { userId },
        {
          $set: { ...patch, updatedAt: new Date() },
          $setOnInsert: { id: generateId(), userId, createdAt: new Date() },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .lean();
  }

  //update an existing session; null when the user has none
  async update(
    userId: string,
    patch: UserAuthSessionPatch,
  ): Promise<UserAuthSession | null> {
    return await this.sessionModel
      .findOneAndUpdate(
        { userId },
        { $set: { ...patch, updatedAt: new Date() } },
        { new: true },
      )
      .lean();
  }

  //count one more wrong guess against the pending code; returns the new total
  async incrementVerificationAttempts(userId: string): Promise<number> {
    const doc = await this.sessionModel
      .findOneAndUpdate(
        { userId },
        { $inc: { verificationAttempts: 1 }, $set: { updatedAt: new Date() } },
        { new: true },
      )
      .lean();
    return doc?.verificationAttempts ?? 0;
  }

  //end a user's session with [status] (Replaced / SignedOut / Expired). The
  //token ids are cleared, so the old tokens can never match again.
  async end(
    userId: string,
    status:
      | SessionStatus.Replaced
      | SessionStatus.SignedOut
      | SessionStatus.Expired,
  ): Promise<UserAuthSession | null> {
    return await this.update(userId, {
      status,
      tokenId: null,
      pendingTokenId: null,
    });
  }

  //delete a user's session (account removal)
  async delete(userId: string): Promise<UserAuthSession | null> {
    return await this.sessionModel.findOneAndDelete({ userId }).lean();
  }
}
