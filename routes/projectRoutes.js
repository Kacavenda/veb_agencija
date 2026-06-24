const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const fsPromises = require('fs/promises');

const Project = require('../models/Project');
const User = require('../models/User');

const router = express.Router();

const UPLOADS_ROOT = path.join(
  __dirname,
  '..',
  'uploads'
);

const MAX_FILES_PER_REQUEST = 10;
const MAX_FILES_PER_PROJECT = 30;
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MAX_PROJECT_MESSAGES = 200;
const MAX_MESSAGE_LENGTH = 2000;

const CLOSED_PROJECT_STATUSES = [
  'completed',
  'cancelled'
];

const ALLOWED_FILE_TYPES = {
  '.jpg': [
    'image/jpeg'
  ],

  '.jpeg': [
    'image/jpeg'
  ],

  '.png': [
    'image/png'
  ],

  '.webp': [
    'image/webp'
  ],

  '.gif': [
    'image/gif'
  ],

  '.pdf': [
    'application/pdf'
  ],

  '.doc': [
    'application/msword'
  ],

  '.docx': [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],

  '.txt': [
    'text/plain'
  ],

  '.zip': [
    'application/zip',
    'application/x-zip-compressed'
  ]
};

function serializeProjectFile(file) {
  return {
    id: file._id,
    originalName: file.originalName,
    fileName: file.fileName,
    mimeType: file.mimeType,
    size: file.size,
    uploadedByRole: file.uploadedByRole,
    uploadedByUserId: file.uploadedByUserId,
    uploadedAt: file.uploadedAt
  };
}

function serializeProjectMessage(message) {
  return {
    id: message._id,
    senderRole: message.senderRole,
    senderId: message.senderId,
    senderName: message.senderName,
    message: message.message,
    status:
      message.status ||
      (message.senderRole === 'admin'
        ? 'answered'
        : 'new'),
    readAt: message.readAt || null,
    createdAt: message.createdAt
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
    files: project.files.map(
      serializeProjectFile
    ),
    messages: project.messages.map(
      serializeProjectMessage
    ),
    clientNote: project.clientNote,
    adminNote: project.adminNote,
    materialsSubmittedAt: project.materialsSubmittedAt,
    materialsRevision: project.materialsRevision,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  };
}

function buildUserQuery(userId, email) {
  const conditions = [];

  if (userId) {
    conditions.push({
      userId
    });
  }

  if (email) {
    conditions.push({
      userEmail: email
    });
  }

  if (!conditions.length) {
    return null;
  }

  return conditions.length === 1
    ? conditions[0]
    : {
        $or: conditions
      };
}

function getRequestUser(req) {
  return {
    userId: String(
      req.headers['x-user-id'] ||
      req.body?.userId ||
      ''
    ).trim(),

    email: String(
      req.headers['x-user-email'] ||
      req.body?.userEmail ||
      ''
    )
      .trim()
      .toLowerCase()
  };
}

function getRequestAdmin(req) {
  return {
    userId: String(
      req.headers['x-admin-user-id'] ||
      ''
    ).trim(),

    email: String(
      req.headers['x-admin-email'] ||
      ''
    )
      .trim()
      .toLowerCase()
  };
}

function userOwnsProject(
  project,
  requestUser
) {
  const matchesUserId =
    Boolean(project.userId) &&
    Boolean(requestUser.userId) &&
    String(project.userId) ===
      String(requestUser.userId);

  const matchesEmail =
    Boolean(project.userEmail) &&
    Boolean(requestUser.email) &&
    String(project.userEmail)
      .trim()
      .toLowerCase() ===
      requestUser.email;

  return (
    matchesUserId ||
    matchesEmail
  );
}

async function requestIsAdmin(req) {
  const requestAdmin =
    getRequestAdmin(req);

  const conditions = [];

  if (
    mongoose.isValidObjectId(
      requestAdmin.userId
    )
  ) {
    conditions.push({
      _id: requestAdmin.userId
    });
  }

  if (requestAdmin.email) {
    conditions.push({
      email: requestAdmin.email
    });
  }

  if (!conditions.length) {
    return null;
  }

  return User.findOne({
    $or: conditions,
    role: 'admin'
  });
}

function validateProjectId(
  req,
  res
) {
  const projectId = String(
    req.params.projectId || ''
  ).trim();

  if (
    !mongoose.isValidObjectId(
      projectId
    )
  ) {
    res.status(400).json({
      message:
        'ID projekta nije ispravan.'
    });

    return null;
  }

  return projectId;
}

async function loadOwnedProject(
  req,
  res,
  next
) {
  try {
    const projectId =
      validateProjectId(
        req,
        res
      );

    if (!projectId) {
      return;
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

    const requestUser =
      getRequestUser(req);

    if (
      !userOwnsProject(
        project,
        requestUser
      )
    ) {
      return res.status(403).json({
        message:
          'Nemaš dozvolu da menjaš ovaj projekat.'
      });
    }

    req.project = project;
    req.projectAccessRole =
      'user';

    return next();
  } catch (error) {
    console.error(
      'Greška pri proveri vlasništva projekta:',
      error
    );

    return res.status(500).json({
      message:
        'Vlasništvo projekta nije moglo da se proveri.'
    });
  }
}

async function loadProjectResourceAccess(
  req,
  res,
  next
) {
  try {
    const projectId =
      validateProjectId(
        req,
        res
      );

    if (!projectId) {
      return;
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

    const requestUser =
      getRequestUser(req);

    if (
      userOwnsProject(
        project,
        requestUser
      )
    ) {
      req.project = project;
      req.projectAccessRole =
        'user';

      return next();
    }

    const admin =
      await requestIsAdmin(req);

    if (!admin) {
      return res.status(403).json({
        message:
          'Nemaš dozvolu za pristup sadržaju ovog projekta.'
      });
    }

    req.project = project;
    req.projectAccessRole =
      'admin';
    req.adminUser = admin;

    return next();
  } catch (error) {
    console.error(
      'Greška pri proveri pristupa projektu:',
      error
    );

    return res.status(500).json({
      message:
        'Pristup projektu nije mogao da se proveri.'
    });
  }
}

function ensureProjectEditable(
  req,
  res,
  next
) {
  if (
    CLOSED_PROJECT_STATUSES.includes(
      req.project.status
    )
  ) {
    return res.status(409).json({
      message:
        'Materijali se ne mogu menjati jer je projekat završen ili otkazan.'
    });
  }

  return next();
}

function sanitizeStoredBaseName(
  originalName
) {
  return path
    .basename(
      String(originalName || 'file')
    )
    .normalize('NFKD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(
      /[^a-zA-Z0-9._-]+/g,
      '-'
    )
    .replace(
      /^[-_.]+|[-_.]+$/g,
      ''
    )
    .slice(0, 70) || 'file';
}

function fileTypeIsAllowed(file) {
  const extension =
    path.extname(
      file.originalname
    )
      .toLowerCase();

  const allowedMimeTypes =
    ALLOWED_FILE_TYPES[
      extension
    ];

  return Boolean(
    allowedMimeTypes &&
    allowedMimeTypes.includes(
      file.mimetype
    )
  );
}

const storage = multer.diskStorage({
  destination: (
    req,
    file,
    callback
  ) => {
    const destination =
      path.join(
        UPLOADS_ROOT,
        'projects',
        String(
          req.project._id
        )
      );

    fs.mkdir(
      destination,
      {
        recursive: true
      },
      (error) => {
        callback(
          error,
          destination
        );
      }
    );
  },

  filename: (
    req,
    file,
    callback
  ) => {
    const extension =
      path.extname(
        file.originalname
      )
        .toLowerCase();

    const safeBaseName =
      sanitizeStoredBaseName(
        path.basename(
          file.originalname,
          extension
        )
      );

    const uniquePart =
      crypto.randomUUID();

    callback(
      null,
      `${Date.now()}-${uniquePart}-${safeBaseName}${extension}`
    );
  }
});

const upload = multer({
  storage,

  limits: {
    files:
      MAX_FILES_PER_REQUEST,

    fileSize:
      MAX_FILE_SIZE
  },

  fileFilter: (
    req,
    file,
    callback
  ) => {
    if (
      fileTypeIsAllowed(file)
    ) {
      callback(
        null,
        true
      );

      return;
    }

    const error =
      new Error(
        `Tip fajla nije dozvoljen: ${file.originalname}`
      );

    error.code =
      'INVALID_FILE_TYPE';

    callback(error);
  }
});

async function cleanupUploadedFiles(
  files = []
) {
  await Promise.allSettled(
    files.map((file) =>
      fsPromises.unlink(
        file.path
      )
    )
  );
}

function uploadProjectFiles(
  req,
  res,
  next
) {
  upload.array(
    'files',
    MAX_FILES_PER_REQUEST
  )(
    req,
    res,
    async (error) => {
      if (!error) {
        return next();
      }

      await cleanupUploadedFiles(
        req.files || []
      );

      if (
        error instanceof
        multer.MulterError
      ) {
        if (
          error.code ===
          'LIMIT_FILE_SIZE'
        ) {
          return res.status(400).json({
            message:
              'Jedan fajl može imati najviše 15 MB.'
          });
        }

        if (
          error.code ===
          'LIMIT_FILE_COUNT'
        ) {
          return res.status(400).json({
            message:
              'Možeš poslati najviše 10 fajlova odjednom.'
          });
        }

        return res.status(400).json({
          message:
            `Upload nije uspeo: ${error.message}`
        });
      }

      return res.status(400).json({
        message:
          error.message ||
          'Fajlovi nisu mogli da se pošalju.'
      });
    }
  );
}

function resolveStoredFilePath(
  storagePath
) {
  const absolutePath =
    path.resolve(
      UPLOADS_ROOT,
      storagePath
    );

  const uploadsRootWithSeparator =
    `${path.resolve(
      UPLOADS_ROOT
    )}${path.sep}`;

  if (
    !absolutePath.startsWith(
      uploadsRootWithSeparator
    )
  ) {
    return null;
  }

  return absolutePath;
}

function contentDisposition(
  disposition,
  originalName
) {
  const safeAsciiName =
    path
      .basename(
        String(
          originalName ||
          'download'
        )
      )
      .replace(
        /["\r\n]/g,
        '_'
      )
      .replace(
        /[^\x20-\x7E]/g,
        '_'
      );

  const encodedName =
    encodeURIComponent(
      path.basename(
        String(
          originalName ||
          'download'
        )
      )
    );

  return (
    `${disposition}; ` +
    `filename="${safeAsciiName}"; ` +
    `filename*=UTF-8''${encodedName}`
  );
}

router.get(
  '/user/:userId',
  async (req, res) => {
    try {
      const userId = String(
        req.params.userId || ''
      ).trim();

      const email = String(
        req.query.email || ''
      )
        .trim()
        .toLowerCase();

      const query =
        buildUserQuery(
          userId,
          email
        );

      if (!query) {
        return res.status(400).json({
          message:
            'ID korisnika ili email nisu prosleđeni.'
        });
      }

      const projects =
        await Project.find(
          query
        ).sort({
          createdAt: -1
        });

      return res.status(200).json({
        count:
          projects.length,

        projects:
          projects.map(
            serializeProject
          )
      });
    } catch (error) {
      console.error(
        'Greška pri učitavanju projekata korisnika:',
        error
      );

      return res.status(500).json({
        message:
          'Projekti korisnika nisu mogli da se učitaju.'
      });
    }
  }
);

router.get(
  '/payment/:paymentId',
  async (req, res) => {
    try {
      const paymentId = String(
        req.params.paymentId || ''
      ).trim();

      if (
        !mongoose.isValidObjectId(
          paymentId
        )
      ) {
        return res.status(400).json({
          message:
            'ID plaćanja nije ispravan.'
        });
      }

      const projects =
        await Project.find({
          payment: paymentId
        }).sort({
          packageId: 1,
          unitIndex: 1
        });

      return res.status(200).json({
        count:
          projects.length,

        projects:
          projects.map(
            serializeProject
          )
      });
    } catch (error) {
      console.error(
        'Greška pri učitavanju projekata plaćanja:',
        error
      );

      return res.status(500).json({
        message:
          'Projekti za ovo plaćanje nisu mogli da se učitaju.'
      });
    }
  }
);

router.patch(
  '/:projectId/materials',
  loadOwnedProject,
  ensureProjectEditable,
  async (req, res) => {
    try {
      const project =
        req.project;

      const autosave =
        req.body.autosave === true;

      const incomingRequirements =
        Array.isArray(
          req.body.requirements
        )
          ? req.body.requirements
          : [];

      const requirementsByKey =
        new Map(
          incomingRequirements.map(
            (requirement) => [
              String(
                requirement.key || ''
              ).trim(),

              requirement
            ]
          )
        );

      project.requirements =
        project.requirements.map(
          (requirement) => {
            const incoming =
              requirementsByKey.get(
                requirement.key
              );

            if (!incoming) {
              return requirement;
            }

            requirement.value =
              String(
                incoming.value || ''
              )
                .trim()
                .slice(0, 3000);

            requirement.provided =
              Boolean(
                incoming.provided
              );

            return requirement;
          }
        );

      project.clientNote =
        String(
          req.body.clientNote ||
          ''
        )
          .trim()
          .slice(0, 3000);

      if (!autosave) {
        project.materialsSubmittedAt =
          new Date();

        project.materialsRevision =
          Number(
            project.materialsRevision ||
            0
          ) + 1;

        if (
          project.status ===
            'new' ||
          project.status ===
            'waiting-for-client'
        ) {
          project.status =
            'reviewing';
        }
      }

      await project.save();

      return res.status(200).json({
        message:
          autosave
            ? 'Izmene su automatski sačuvane.'
            : 'Materijali su uspešno sačuvani i poslati administratoru na pregled.',

        project:
          serializeProject(
            project
          )
      });
    } catch (error) {
      console.error(
        'Greška pri čuvanju materijala:',
        error
      );

      if (
        error.name ===
        'ValidationError'
      ) {
        const firstError =
          Object.values(
            error.errors
          )[0];

        return res.status(400).json({
          message:
            firstError?.message ||
            'Materijali nisu ispravni.'
        });
      }

      return res.status(500).json({
        message:
          'Materijali nisu mogli da se sačuvaju.'
      });
    }
  }
);

router.get(
  '/:projectId/messages',
  loadProjectResourceAccess,
  async (req, res) => {
    return res.status(200).json({
      messages:
        req.project.messages.map(
          serializeProjectMessage
        )
    });
  }
);

router.post(
  '/:projectId/messages',
  loadProjectResourceAccess,
  async (req, res) => {
    try {
      const project =
        req.project;

      const messageText =
        String(
          req.body.message ||
          ''
        )
          .trim()
          .slice(
            0,
            MAX_MESSAGE_LENGTH
          );

      if (!messageText) {
        return res.status(400).json({
          message:
            'Poruka ne može biti prazna.'
        });
      }

      if (
        project.messages.length >=
        MAX_PROJECT_MESSAGES
      ) {
        return res.status(409).json({
          message:
            `Dostignut je limit od ${MAX_PROJECT_MESSAGES} poruka za ovaj projekat.`
        });
      }

      let senderId = '';
      let senderName = '';

      if (
        req.projectAccessRole ===
        'admin'
      ) {
        senderId =
          String(
            req.adminUser?._id ||
            ''
          );

        senderName =
          String(
            req.adminUser?.name ||
            'Administrator'
          )
            .trim()
            .slice(0, 120);
      } else {
        const requestUser =
          getRequestUser(req);

        senderId =
          requestUser.userId ||
          String(
            project.userId ||
            ''
          );

        senderName =
          String(
            project.userName ||
            'Korisnik'
          )
            .trim()
            .slice(0, 120);
      }

      const sentAt =
        new Date();

      if (
        req.projectAccessRole ===
          'admin'
      ) {
        project.messages.forEach(
          (existingMessage) => {
            if (
              existingMessage.senderRole ===
                'user' &&
              (
                !existingMessage.status ||
                existingMessage.status ===
                  'new'
              )
            ) {
              existingMessage.status =
                'answered';
              existingMessage.readAt =
                sentAt;
            }
          }
        );
      }

      project.messages.push({
        senderRole:
          req.projectAccessRole,
        senderId,
        senderName,
        message:
          messageText,
        status:
          req.projectAccessRole ===
            'admin'
            ? 'answered'
            : 'new',
        readAt:
          req.projectAccessRole ===
            'admin'
            ? sentAt
            : null,
        createdAt:
          sentAt
      });

      await project.save();

      return res.status(201).json({
        message:
          'Poruka je uspešno poslata.',

        project:
          serializeProject(
            project
          )
      });
    } catch (error) {
      console.error(
        'Greška pri slanju projektne poruke:',
        error
      );

      if (
        error.name ===
        'ValidationError'
      ) {
        const firstError =
          Object.values(
            error.errors
          )[0];

        return res.status(400).json({
          message:
            firstError?.message ||
            'Poruka nije ispravna.'
        });
      }

      return res.status(500).json({
        message:
          'Poruka nije mogla da se pošalje.'
      });
    }
  }
);

router.post(
  '/:projectId/files',
  loadOwnedProject,
  ensureProjectEditable,
  uploadProjectFiles,
  async (req, res) => {
    try {
      const project =
        req.project;

      const uploadedFiles =
        Array.isArray(
          req.files
        )
          ? req.files
          : [];

      if (
        !uploadedFiles.length
      ) {
        return res.status(400).json({
          message:
            'Nijedan fajl nije izabran.'
        });
      }

      if (
        project.files.length +
          uploadedFiles.length >
        MAX_FILES_PER_PROJECT
      ) {
        await cleanupUploadedFiles(
          uploadedFiles
        );

        return res.status(400).json({
          message:
            `Jedan projekat može imati najviše ${MAX_FILES_PER_PROJECT} fajlova.`
        });
      }

      const requestUser =
        getRequestUser(req);

      uploadedFiles.forEach(
        (file) => {
          const storagePath =
            path
              .relative(
                UPLOADS_ROOT,
                file.path
              )
              .split(
                path.sep
              )
              .join('/');

          project.files.push({
            originalName:
              path
                .basename(
                  file.originalname
                )
                .slice(0, 255),

            fileName:
              file.filename,

            storagePath,

            mimeType:
              file.mimetype,

            size:
              file.size,

            uploadedByRole:
              'user',

            uploadedByUserId:
              requestUser.userId,

            uploadedAt:
              new Date()
          });
        }
      );

      project.materialsSubmittedAt =
        new Date();

      project.materialsRevision =
        Number(
          project.materialsRevision ||
          0
        ) + 1;

      if (
        project.status ===
          'new' ||
        project.status ===
          'waiting-for-client'
      ) {
        project.status =
          'reviewing';
      }

      await project.save();

      return res.status(201).json({
        message:
          `${uploadedFiles.length} ${
            uploadedFiles.length === 1
              ? 'fajl je uspešno poslat'
              : 'fajla su uspešno poslata'
          } administratoru.`,

        project:
          serializeProject(
            project
          )
      });
    } catch (error) {
      await cleanupUploadedFiles(
        req.files || []
      );

      console.error(
        'Greška pri čuvanju fajlova projekta:',
        error
      );

      return res.status(500).json({
        message:
          'Fajlovi nisu mogli da se sačuvaju.'
      });
    }
  }
);

router.get(
  '/:projectId/files',
  loadProjectResourceAccess,
  async (req, res) => {
    return res.status(200).json({
      files:
        req.project.files.map(
          serializeProjectFile
        )
    });
  }
);

router.get(
  '/:projectId/files/:fileId/content',
  loadProjectResourceAccess,
  async (req, res) => {
    try {
      const file =
        req.project.files.id(
          req.params.fileId
        );

      if (!file) {
        return res.status(404).json({
          message:
            'Fajl nije pronađen.'
        });
      }

      const absolutePath =
        resolveStoredFilePath(
          file.storagePath
        );

      if (!absolutePath) {
        return res.status(400).json({
          message:
            'Putanja fajla nije ispravna.'
        });
      }

      try {
        await fsPromises.access(
          absolutePath
        );
      } catch (error) {
        return res.status(404).json({
          message:
            'Fajl ne postoji na serveru.'
        });
      }

      const inline =
        req.query.inline ===
        'true';

      res.setHeader(
        'Content-Type',
        file.mimeType
      );

      res.setHeader(
        'Content-Disposition',
        contentDisposition(
          inline
            ? 'inline'
            : 'attachment',

          file.originalName
        )
      );

      return res.sendFile(
        absolutePath
      );
    } catch (error) {
      console.error(
        'Greška pri otvaranju fajla:',
        error
      );

      return res.status(500).json({
        message:
          'Fajl nije mogao da se otvori.'
      });
    }
  }
);

router.delete(
  '/:projectId/files/:fileId',
  loadProjectResourceAccess,
  async (req, res) => {
    try {
      const project =
        req.project;

      if (
        req.projectAccessRole ===
          'user' &&
        CLOSED_PROJECT_STATUSES.includes(
          project.status
        )
      ) {
        return res.status(409).json({
          message:
            'Fajl se ne može obrisati jer je projekat završen ili otkazan.'
        });
      }

      const file =
        project.files.id(
          req.params.fileId
        );

      if (!file) {
        return res.status(404).json({
          message:
            'Fajl nije pronađen.'
        });
      }

      const absolutePath =
        resolveStoredFilePath(
          file.storagePath
        );

      project.files.pull(
        file._id
      );

      if (
        req.projectAccessRole ===
        'user'
      ) {
        project.materialsSubmittedAt =
          new Date();

        project.materialsRevision =
          Number(
            project.materialsRevision ||
            0
          ) + 1;

        if (
          project.status ===
            'new' ||
          project.status ===
            'waiting-for-client'
        ) {
          project.status =
            'reviewing';
        }
      }

      await project.save();

      if (absolutePath) {
        try {
          await fsPromises.unlink(
            absolutePath
          );
        } catch (error) {
          if (
            error.code !==
            'ENOENT'
          ) {
            console.error(
              'Fizički fajl nije mogao da se obriše:',
              error
            );
          }
        }
      }

      return res.status(200).json({
        message:
          'Fajl je uspešno obrisan.',

        project:
          serializeProject(
            project
          )
      });
    } catch (error) {
      console.error(
        'Greška pri brisanju fajla:',
        error
      );

      return res.status(500).json({
        message:
          'Fajl nije mogao da se obriše.'
      });
    }
  }
);

router.get(
  '/:projectId',
  loadProjectResourceAccess,
  async (req, res) => {
    return res.status(200).json({
      project:
        serializeProject(
          req.project
        )
    });
  }
);

module.exports = router;
