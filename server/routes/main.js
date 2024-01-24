const express = require('express');
const router = express.Router();
const Post = require('../models/Post');


/**
 * GET /
 * HOME
*/
router.get('', async (req, res) => {
    try {
      // Chuẩn bị thông tin cho trang chủ
      const locals ={
        title: "NodeJs Blog",
        description: "Simple Blog created with NodeJs, Express &MongoDb"
    };
    
    // Số bài viết hiển thị trên mỗi trang
    let perPage = 3;
    // Lấy trang hiện tại từ tham số truy vấn hoặc mặc định là trang 1
    let page = req.query.page || 1;

     // Sử dụng aggregation để lấy danh sách bài viết sắp xếp theo thời gian tạo giảm dần
    const data = await Post.aggregate([ { $sort: { createdAt: -1 } } ])
    .skip(perPage * page - perPage)
    .limit(perPage)
    .exec();

    // Lấy tổng số bài viết
    const count = await Post.countDocuments();

    // Tính toán trang tiếp theo và kiểm tra xem còn trang kế tiếp hay không
    const nextPage = parseInt(page) + 1;
    const hasNextPage = nextPage <= Math.ceil(count / perPage);

      // Hiển thị trang chủ với thông tin và dữ liệu được truyền vào
      res.render('index', { 
        locals, 
        data,
        current: page, 
        nextPage: hasNextPage ? nextPage : null,
        currentRoute: '/'
      });


    } catch (error) {
      console.log(error);
    }

   
      
    });


   /**
 * GET /
 * Post :id
*/
 router.get('/post/:id', async (req, res) => {
    try {
    // Lấy slug từ tham số đường dẫn
     let slug = req.params.id;

      // Tìm bài viết dựa trên ID
      const data = await Post.findById({ _id: slug });
      
      // Chuẩn bị thông tin cho trang chi tiết bài viết
      const locals ={
        title: data.title,
        description: "Simple Blog created with NodeJs, Express &MongoDb"
     };

      // Hiển thị trang chi tiết bài viết với thông tin và dữ liệu được truyền vào
      res.render('post', { 
        locals,
         data,
         currentRoute: `/post/${slug}`
         });
    } catch (error) {
     console.log(error);
    }

  });


    /**
 * GET /
 * About
*/
router.get('/about', (req, res) => {
    // Hiển thị trang giới thiệu
    res.render('about', {
      currentRoute: '/about'  
    });  
  });

module.exports = router;