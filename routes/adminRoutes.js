const express = require('express');
const mongoose = require('mongoose');

const User = require('../models/User');
const Project = require('../models/Project');
const Payment = require('../models/Payment');
const ContactMessage = require('../models/ContactMessage');

const router = express.Router();

const PROJECT_STATUSES = [
  'new',
  'reviewing',
  'waiting-for-client',
  'accepted',
  'in-progress',
  'testing',
  'completed',
  'cancelled'
];

const MESSAGE_STATUSES = [
  'new',
  'read',
  'answered'
];

function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function serializeProject(project) {
  return {
    id: project._id,
    projectCode: project.projectCode,
    userId: project.userId,
    userName: project.userName,
    userEmail: project.userEmail,
    paymentId: project.payment,
    paypalOrderId: project.paypalOrderId,
    packageId: project.packageId,
    packageName: project.packageName,
    unitIndex: project.unitIndex,
    totalUnitsInPurchase: project.totalUnitsInPurchase,
    status: project.status,
    paymentStatus: project.paymentStatus,
    currency: project.currency,
    totalPrice: project.totalPrice,
    configuration: project.configuration,
    requirements: project.requirements,
    files: project.files.map((file) => ({
      id: file._id,
      originalName: file.originalName,
      fileName: file.fileName,
      mimeType: file.mimeType,
      size: file.size,
      uploadedByRole: file.uploadedByRole,
      uploadedByUserId: file.uploadedByUserId,
      uploadedAt: file.uploadedAt
    })),
    messages: project.messages.map((message) => ({
      id: message._id,
      senderRole: message.senderRole,
      senderId: message.senderId,
      senderName: message.senderName,
      message: message.message,
      createdAt: message.createdAt
    })),
    clientNote: project.clientNote,
    adminNote: project.adminNote,
    materialsSubmittedAt: project.materialsSubmittedAt,
    materialsRevision: project.materialsRevision,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  };
}

function serializePayment(payment) {
  return {
    id: payment._id,
    paypalOrderId: payment.paypalOrderId,
    paypalCaptureId: payment.paypalCaptureId,
    status: payment.status,
    currency: payment.currency,
    amount: payment.amount,
    payer: payment.payer,
    applicationUser: payment.applicationUser,
    items: payment.items,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt
  };
}

function serializeMessage(message) {
  return {
    id: message._id,
    name: message.name,
    email: message.email,
    websiteType: message.websiteType,
    message: message.message,
    source: 'contact',
    status: message.status,
    projectId: null,
    projectCode: '',
    packageName: '',
    createdAt: message.createdAt,
    updatedAt: message.updatedAt
  };
}


function serializeProjectInboxMessage(
  project,
  projectMessage
) {
  return {
    id:
      `project:${project._id}:${projectMessage._id}`,
    source: 'project',
    name:
      project.userName ||
      projectMessage.senderName ||
      'Korisnik',
    email:
      project.userEmail ||
      '',
    websiteType:
      `${project.packageName} · ${project.projectCode}`,
    projectId:
      project._id,
    projectCode:
      project.projectCode,
    packageName:
      project.packageName,
    message:
      projectMessage.message,
    status:
      projectMessage.status ||
      'new',
    createdAt:
      projectMessage.createdAt,
    updatedAt:
      project.updatedAt
  };
}

/*
  Ovaj projekat trenutno ne koristi JWT/cookies.
  Zato frontend šalje ID i email prijavljenog administratora,
  a backend proverava da li taj korisnik zaista postoji i ima role: admin.
*/
async function requireAdmin(req, res, next) {
  try {
    const adminUserId = String(
      req.headers['x-admin-user-id'] || ''
    ).trim();

    const adminEmail = String(
      req.headers['x-admin-email'] || ''
    )
      .trim()
      .toLowerCase();

    const conditions = [];

    if (mongoose.isValidObjectId(adminUserId)) {
      conditions.push({
        _id: adminUserId
      });
    }

    if (adminEmail) {
      conditions.push({
        email: adminEmail
      });
    }

    if (!conditions.length) {
      return res.status(401).json({
        message: 'Administratorski podaci nisu prosleđeni.'
      });
    }

    const admin = await User.findOne({
      $or: conditions
    });

    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({
        message: 'Nemate dozvolu za pristup admin panelu.'
      });
    }

    req.adminUser = admin;
    return next();
  } catch (error) {
    console.error('Admin provera nije uspela:', error);

    return res.status(500).json({
      message: 'Administratorska provera nije uspela.'
    });
  }
}

router.use(requireAdmin);

router.get('/overview', async (req, res) => {
  try {
    const [
      usersCount,
      projectsCount,
      activeProjectsCount,
      waitingProjectsCount,
      completedProjectsCount,
      paymentsCount,
      contactUnreadMessagesCount,
      projectUnreadMessagesResult,
      revenueResult,
      recentProjects,
      recentPayments
    ] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      Project.countDocuments({
        status: {
          $in: [
            'new',
            'reviewing',
            'accepted',
            'in-progress',
            'testing'
          ]
        }
      }),
      Project.countDocuments({
        status: 'waiting-for-client'
      }),
      Project.countDocuments({
        status: 'completed'
      }),
      Payment.countDocuments({
        status: 'COMPLETED'
      }),
      ContactMessage.countDocuments({
        status: 'new'
      }),
      Project.aggregate([
        {
          $unwind: '$messages'
        },
        {
          $match: {
            'messages.senderRole': 'user',
            $or: [
              {
                'messages.status': 'new'
              },
              {
                'messages.status': {
                  $exists: false
                }
              }
            ]
          }
        },
        {
          $count: 'count'
        }
      ]),
      Payment.aggregate([
        {
          $match: {
            status: 'COMPLETED'
          }
        },
        {
          $group: {
            _id: '$currency',
            total: {
              $sum: '$amount'
            }
          }
        }
      ]),
      Project.find()
        .sort({
          createdAt: -1
        })
        .limit(6),
      Payment.find()
        .sort({
          createdAt: -1
        })
        .limit(6)
    ]);

    const projectUnreadMessagesCount =
      Number(
        projectUnreadMessagesResult[0]
          ?.count ||
        0
      );

    const unreadMessagesCount =
      Number(
        contactUnreadMessagesCount ||
        0
      ) +
      projectUnreadMessagesCount;

    const revenue = revenueResult.reduce(
      (result, item) => {
        result[item._id || 'EUR'] =
          Number(item.total) || 0;

        return result;
      },
      {}
    );

    return res.status(200).json({
      admin: serializeUser(req.adminUser),
      stats: {
        usersCount,
        projectsCount,
        activeProjectsCount,
        waitingProjectsCount,
        completedProjectsCount,
        paymentsCount,
        unreadMessagesCount,
        revenue
      },
      recentProjects:
        recentProjects.map(
          serializeProject
        ),
      recentPayments:
        recentPayments.map(
          serializePayment
        )
    });
  } catch (error) {
    console.error(
      'Greška pri učitavanju admin pregleda:',
      error
    );

    return res.status(500).json({
      message:
        'Admin pregled nije mogao da se učita.'
    });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .sort({
        createdAt: -1
      });

    const userIds = users.map((user) =>
      String(user._id)
    );

    const [
      projectCounts,
      paymentCounts
    ] = await Promise.all([
      Project.aggregate([
        {
          $match: {
            userId: {
              $in: userIds
            }
          }
        },
        {
          $group: {
            _id: '$userId',
            count: {
              $sum: 1
            }
          }
        }
      ]),
      Payment.aggregate([
        {
          $match: {
            'applicationUser.userId': {
              $in: userIds
            }
          }
        },
        {
          $group: {
            _id:
              '$applicationUser.userId',
            count: {
              $sum: 1
            },
            spent: {
              $sum: '$amount'
            }
          }
        }
      ])
    ]);

    const projectMap =
      Object.fromEntries(
        projectCounts.map((item) => [
          item._id,
          item.count
        ])
      );

    const paymentMap =
      Object.fromEntries(
        paymentCounts.map((item) => [
          item._id,
          {
            count: item.count,
            spent: item.spent
          }
        ])
      );

    return res.status(200).json({
      users: users.map((user) => ({
        ...serializeUser(user),
        projectsCount:
          projectMap[
            String(user._id)
          ] || 0,
        purchasesCount:
          paymentMap[
            String(user._id)
          ]?.count || 0,
        totalSpent:
          paymentMap[
            String(user._id)
          ]?.spent || 0
      }))
    });
  } catch (error) {
    console.error(
      'Greška pri učitavanju korisnika:',
      error
    );

    return res.status(500).json({
      message:
        'Korisnici nisu mogli da se učitaju.'
    });
  }
});

router.patch(
  '/users/:userId/role',
  async (req, res) => {
    try {
      const userId = String(
        req.params.userId || ''
      ).trim();

      const role = String(
        req.body.role || ''
      ).trim();

      if (
        !mongoose.isValidObjectId(
          userId
        )
      ) {
        return res.status(400).json({
          message:
            'ID korisnika nije ispravan.'
        });
      }

      if (
        !['user', 'admin'].includes(
          role
        )
      ) {
        return res.status(400).json({
          message:
            'Uloga mora biti user ili admin.'
        });
      }

      if (
        String(req.adminUser._id) ===
          userId &&
        role !== 'admin'
      ) {
        return res.status(400).json({
          message:
            'Ne možeš ukloniti admin ulogu sa trenutno prijavljenog naloga.'
        });
      }

      const user =
        await User.findByIdAndUpdate(
          userId,
          {
            role
          },
          {
            new: true,
            runValidators: true
          }
        );

      if (!user) {
        return res.status(404).json({
          message:
            'Korisnik nije pronađen.'
        });
      }

      return res.status(200).json({
        message:
          'Uloga korisnika je uspešno promenjena.',
        user: serializeUser(user)
      });
    } catch (error) {
      console.error(
        'Greška pri promeni uloge:',
        error
      );

      return res.status(500).json({
        message:
          'Uloga korisnika nije mogla da se promeni.'
      });
    }
  }
);

router.get('/projects', async (req, res) => {
  try {
    const status = String(
      req.query.status || ''
    ).trim();

    const packageId = String(
      req.query.packageId || ''
    ).trim();

    const search = String(
      req.query.search || ''
    ).trim();

    const query = {};

    if (
      status &&
      PROJECT_STATUSES.includes(status)
    ) {
      query.status = status;
    }

    if (
      packageId &&
      ['basic', 'pro', 'premium'].includes(
        packageId
      )
    ) {
      query.packageId = packageId;
    }

    if (search) {
      query.$or = [
        {
          projectCode: {
            $regex: search,
            $options: 'i'
          }
        },
        {
          userName: {
            $regex: search,
            $options: 'i'
          }
        },
        {
          userEmail: {
            $regex: search,
            $options: 'i'
          }
        },
        {
          paypalOrderId: {
            $regex: search,
            $options: 'i'
          }
        }
      ];
    }

    const projects = await Project.find(
      query
    ).sort({
      createdAt: -1
    });

    return res.status(200).json({
      projects:
        projects.map(
          serializeProject
        )
    });
  } catch (error) {
    console.error(
      'Greška pri učitavanju projekata:',
      error
    );

    return res.status(500).json({
      message:
        'Projekti nisu mogli da se učitaju.'
    });
  }
});

router.patch(
  '/projects/:projectId',
  async (req, res) => {
    try {
      const projectId = String(
        req.params.projectId || ''
      ).trim();

      if (
        !mongoose.isValidObjectId(
          projectId
        )
      ) {
        return res.status(400).json({
          message:
            'ID projekta nije ispravan.'
        });
      }

      const project =
        await Project.findById(
          projectId
        );

      if (!project) {
        return res.status(404).json({
          message:
            'Projekat nije pronađen.'
        });
      }

      if (
        req.body.status !== undefined
      ) {
        const status = String(
          req.body.status
        ).trim();

        if (
          !PROJECT_STATUSES.includes(
            status
          )
        ) {
          return res.status(400).json({
            message:
              'Status projekta nije ispravan.'
          });
        }

        project.status = status;
      }

      if (
        req.body.adminNote !== undefined
      ) {
        project.adminNote = String(
          req.body.adminNote || ''
        ).trim();
      }

      if (
        Array.isArray(
          req.body.requirements
        )
      ) {
        const incomingRequirements =
          new Map(
            req.body.requirements.map(
              (requirement) => [
                String(
                  requirement.key || ''
                ),
                requirement
              ]
            )
          );

        project.requirements =
          project.requirements.map(
            (requirement) => {
              const incoming =
                incomingRequirements.get(
                  requirement.key
                );

              if (!incoming) {
                return requirement;
              }

              requirement.provided =
                Boolean(
                  incoming.provided
                );

              if (
                incoming.value !==
                undefined
              ) {
                requirement.value =
                  String(
                    incoming.value || ''
                  ).trim();
              }

              return requirement;
            }
          );
      }

      await project.save();

      return res.status(200).json({
        message:
          'Projekat je uspešno ažuriran.',
        project:
          serializeProject(project)
      });
    } catch (error) {
      console.error(
        'Greška pri ažuriranju projekta:',
        error
      );

      return res.status(500).json({
        message:
          'Projekat nije mogao da se ažurira.'
      });
    }
  }
);

router.get('/payments', async (req, res) => {
  try {
    const payments = await Payment.find()
      .sort({
        createdAt: -1
      });

    return res.status(200).json({
      payments:
        payments.map(
          serializePayment
        )
    });
  } catch (error) {
    console.error(
      'Greška pri učitavanju plaćanja:',
      error
    );

    return res.status(500).json({
      message:
        'Plaćanja nisu mogla da se učitaju.'
    });
  }
});

router.get('/messages', async (req, res) => {
  try {
    const [
      contactMessages,
      projectsWithMessages
    ] = await Promise.all([
      ContactMessage.find({
        status: {
          $ne: 'answered'
        }
      })
        .sort({
          createdAt: -1
        }),
      Project.find({
        messages: {
          $elemMatch: {
            senderRole: 'user',
            status: {
              $ne: 'answered'
            }
          }
        }
      }).sort({
        updatedAt: -1
      })
    ]);

    const projectMessages =
      projectsWithMessages.flatMap(
        (project) =>
          project.messages
            .filter(
              (message) =>
                message.senderRole ===
                  'user' &&
                message.status !==
                  'answered'
            )
            .map(
              (message) =>
                serializeProjectInboxMessage(
                  project,
                  message
                )
            )
      );

    const allMessages = [
      ...contactMessages.map(
        serializeMessage
      ),
      ...projectMessages
    ].sort(
      (first, second) =>
        new Date(second.createdAt) -
        new Date(first.createdAt)
    );

    return res.status(200).json({
      messages: allMessages
    });
  } catch (error) {
    console.error(
      'Greška pri učitavanju poruka:',
      error
    );

    return res.status(500).json({
      message:
        'Poruke nisu mogle da se učitaju.'
    });
  }
});

router.patch(
  '/messages/:messageId/status',
  async (req, res) => {
    try {
      const messageId = String(
        req.params.messageId || ''
      ).trim();

      const status = String(
        req.body.status || ''
      ).trim();

      if (
        messageId.startsWith(
          'project:'
        )
      ) {
        const parts =
          messageId.split(':');

        const projectId =
          parts[1] || '';

        const projectMessageId =
          parts[2] || '';

        if (
          !mongoose.isValidObjectId(
            projectId
          ) ||
          !mongoose.isValidObjectId(
            projectMessageId
          )
        ) {
          return res.status(400).json({
            message:
              'ID projektne poruke nije ispravan.'
          });
        }

        if (
          !MESSAGE_STATUSES.includes(
            status
          )
        ) {
          return res.status(400).json({
            message:
              'Status poruke nije ispravan.'
          });
        }

        const project =
          await Project.findById(
            projectId
          );

        if (!project) {
          return res.status(404).json({
            message:
              'Projekat nije pronađen.'
          });
        }

        const projectMessage =
          project.messages.id(
            projectMessageId
          );

        if (!projectMessage) {
          return res.status(404).json({
            message:
              'Projektna poruka nije pronađena.'
          });
        }

        projectMessage.status =
          status;

        projectMessage.readAt =
          status === 'new'
            ? null
            : new Date();

        await project.save();

        return res.status(200).json({
          message:
            'Status projektne poruke je promenjen.',
          data:
            serializeProjectInboxMessage(
              project,
              projectMessage
            )
        });
      }

      if (
        !mongoose.isValidObjectId(
          messageId
        )
      ) {
        return res.status(400).json({
          message:
            'ID poruke nije ispravan.'
        });
      }

      if (
        !MESSAGE_STATUSES.includes(
          status
        )
      ) {
        return res.status(400).json({
          message:
            'Status poruke nije ispravan.'
        });
      }

      const message =
        await ContactMessage.findByIdAndUpdate(
          messageId,
          {
            status
          },
          {
            new: true,
            runValidators: true
          }
        );

      if (!message) {
        return res.status(404).json({
          message:
            'Poruka nije pronađena.'
        });
      }

      return res.status(200).json({
        message:
          'Status poruke je promenjen.',
        data:
          serializeMessage(message)
      });
    } catch (error) {
      console.error(
        'Greška pri promeni statusa poruke:',
        error
      );

      return res.status(500).json({
        message:
          'Status poruke nije mogao da se promeni.'
      });
    }
  }
);

module.exports = router;
