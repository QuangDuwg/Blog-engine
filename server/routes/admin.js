const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const adminLayout = '../views/layouts/admin';
const jwtSecret = process.env.JWT_SECRET;


/**
 * 
 * Check Login
*/
const authMiddleware = (req, res, next ) => {
     // Lấy token từ cookie
    const token = req.cookies.token;
  
    // Kiểm tra xem token có tồn tại không
    if(!token) {
      return res.status(401).json( { message: 'Unauthorized'} );
    }
  
    try {
      // Giải mã token để lấy userId
      const decoded = jwt.verify(token, jwtSecret);
      req.userId = decoded.userId;
      // Tiếp tục đến middleware hoặc route tiếp theo
      next();
    } catch(error) {
      // Trả về lỗi nếu không thể giải mã token
      res.status(401).json( { message: 'Unauthorized'} );
    }
  }


/**
 * GET /
 * Admin - Login Page
*/
 router.get('/admin', async (req, res) => {
      try {
        // Chuẩn bị thông tin cho trang đăng nhập admin
        const locals ={
            title: "Admin",
            description: "Simple Blog created with NodeJs, Express &MongoDb"
        };
        // Hiển thị trang đăng nhập với layout của admin
        res.render('admin/index', { locals, layout: adminLayout });
      } catch (error) {
       console.log(error);
      } 
      });


/**
 * POST /
 * Admin - Check Login
*/
router.post('/admin', async (req, res) => {
    try {
        // Lấy thông tin người dùng từ biểu mẫu đăng nhập
        const { username, password } =req.body;
        
        // Tìm kiếm người dùng trong cơ sở dữ liệu
        const user = await User.findOne( { username } );

    // Kiểm tra xem người dùng có tồn tại và mật khẩu có đúng không
    if(!user) {
      return res.status(401).json( { message: 'Invalid credentials' } );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if(!isPasswordValid) {
      return res.status(401).json( { message: 'Invalid credentials' } );
    }
    
    // Nếu đăng nhập thành công, tạo token và đặt vào cookie, sau đó chuyển hướng đến dashboard
    const token = jwt.sign({ userId: user._id}, jwtSecret );
    res.cookie('token', token, { httpOnly: true });
    res.redirect('/dashboard');
        
    } catch (error) {
     console.log(error);
    } 
    });


/**
 * GET /
 * Admin Dashboard
*/
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
      // Chuẩn bị thông tin cho trang dashboard
      const locals = {
        title: 'Dashboard',
        description: 'Simple Blog created with NodeJs, Express & MongoDb.'
      };

      // Lấy danh sách bài viết từ cơ sở dữ liệu và hiển thị trang dashboard với layout của admin
      const data = await Post.find();
    res.render('admin/dashboard', {
      locals,
      data,
      layout: adminLayout
    });

  } catch (error) {
    console.log(error);
  }

});


/**
 * GET /
 * Admin - Create New Post
*/
router.get('/add-post', authMiddleware, async (req, res) => {
  try {
    // Chuẩn bị thông tin cần thiết cho trang
      const locals = {
        title: 'Add Post',
        description: 'Simple Blog created with NodeJs, Express & MongoDb.'
      };

      
    // Lấy danh sách tất cả bài viết từ cơ sở dữ liệu
      const data = await Post.find();

      
    // Hiển thị trang tạo bài viết mới với layout của admin
    res.render('admin/add-post', {
      locals,
      layout: adminLayout
    });

  } catch (error) {
    console.log(error);
  }

});


/**
 * POST /
 * Admin - Create New Post
*/
router.post('/add-post', authMiddleware, async (req, res) => {
  try {
      try {
      // Tạo một đối tượng mới Post từ dữ liệu biểu mẫu
        const newPost = new Post({
          title: req.body.title,
          body: req.body.body
        });

        
      // Lưu bài viết mới vào cơ sở dữ liệu
        await Post.create(newPost);
      // Chuyển hướng về trang dashboard sau khi tạo bài viết
        res.redirect('/dashboard');
      } catch (error) {
        console.log(error);
      }
    
  } catch (error) {
    console.log(error);
  }
});


/**
 * GET /
 * Admin - Edit Post
*/
router.get('/edit-post/:id', authMiddleware, async (req, res) => {
  try {
 // Chuẩn bị thông tin cần thiết cho trang chỉnh sửa bài viết
    const locals = {
      title: "Edit Post",
      description: "Free NodeJs User Management System",
    };

    
    // Lấy thông tin bài viết cần chỉnh sửa từ cơ sở dữ liệu
    const data = await Post.findOne({ _id: req.params.id });

    // Hiển thị trang chỉnh sửa bài viết với layout của admin
    res.render('admin/edit-post', {
      locals,
      data,
      layout: adminLayout
    })

  } catch (error) {
    console.log(error);
  }

});


/**
 * PUT /
 * Admin - Update Post
*/
router.put('/edit-post/:id', authMiddleware, async (req, res) => {
  try {

    // Cập nhật thông tin bài viết trong cơ sở dữ liệu
    await Post.findByIdAndUpdate(req.params.id, {
      title: req.body.title,
      body: req.body.body,
      updatedAt: Date.now()
    });

    
    // Chuyển hướng về trang chỉnh sửa bài viết sau khi cập nhật
    res.redirect(`/edit-post/${req.params.id}`);

  } catch (error) {
    console.log(error);
  }

});

     /**
 * POST /
 * Admin - Register
*/
router.post('/register', async (req, res) => {
    try {
        // Lấy thông tin người dùng từ biểu mẫu đăng ký
        const { username, password } =req.body;
        // Băm mật khẩu trước khi lưu vào cơ sở dữ liệu
        const hashedPassword = await bcrypt.hash(password, 10);
        
        try {
            // Tạo một người dùng mới trong cơ sở dữ liệu 
            const user = await User.create({ username, password:hashedPassword });
            // Trả về thông báo và thông tin người dùng nếu đăng ký thành công
            res.status(201).json({ message: 'User Created', user });
        } catch (error) {
          // Xử lý lỗi khi tạo người dùng, kiểm tra xem người dùng đã tồn tại hay chưa
          if(error.code === 11000) {
            res.status(409).json({ message: 'User already in use'});
          }
          // Trả về lỗi nếu có lỗi khác
          res.status(500).json({  message: 'Internal server error'})
     
        }
        
    } catch (error) {
     console.log(error);
    }

      
    });

    /**
 * DELETE /
 * Admin - Delete Post
*/
router.delete('/delete-post/:id', authMiddleware, async (req, res) => {

  try {
    // Xóa bài viết từ cơ sở dữ liệu dựa trên ID
    await Post.deleteOne( { _id: req.params.id } );
    // Chuyển hướng về trang dashboard sau khi xóa bài viết
    res.redirect('/dashboard');
  } catch (error) {
    console.log(error);
  }

});


/**
 * GET /
 * Admin Logout
*/
router.get('/logout', (req, res) => {
  // Xóa cookie 'token' khi người dùng đăng xuất
  res.clearCookie('token');
  // Chuyển hướng về trang chủ sau khi đăng xuất
  res.redirect('/');
});


module.exports = router;
