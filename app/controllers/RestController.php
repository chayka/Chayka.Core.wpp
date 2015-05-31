<?php

namespace Chayka\Core;

use Chayka\WP\Helpers\DbHelper;
use Chayka\WP\MVC;
use Chayka\Helpers\InputHelper;
use Chayka\WP\Helpers\JsonHelper;

class RestController extends MVC\RestController{

	// TODO: add security checks
	public function listAction($respond = true){
		/**
		 * @var \Chayka\WP\Queries\PostQuery|\Chayka\WP\Queries\CommentQuery|\Chayka\WP\Queries\UserQuery $query
		 */
		$query = call_user_func(array($this->getModelClassName(), 'query'));
		$params = InputHelper::getParams(true);
		$query->setVars($params);
		$items = $query->select();
		$total = DbHelper::rowsFound();
		$payload = array(
			'items' => $items,
			'total' => (int)$total,
			'query' => $params
		);

		if($respond) {
			JsonHelper::respond( $payload );
		}

		return $payload;
	}
}